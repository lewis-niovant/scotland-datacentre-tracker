#!/usr/bin/env python3
"""Fetch official red-line planning boundaries from Spatial Hub Scotland.

Run MANUALLY (never in CI) with a Spatial Hub authkey in the environment:

    export SPATIALHUB_AUTHKEY='<your token>'
    python3 scripts/fetch_boundaries.py

Writes data/projects/<slug>/geo/boundary.geojson for every project whose
planning references match a polygon in the official dataset, updates each
site.json's boundary_precision, appends the source-ledger entry, and prints an
area-reconciliation report comparing official geometry against our researched
site_area_m2 figures.

Data: Spatial Hub Scotland, "Planning Applications: Official" (Improvement
Service), layer sh_plnapp:pub_plnapppol. Licence: Open Government Licence v3.

Access notes (discovered by testing, keep for reproducibility):
  * The Spatial Hub token is a CKAN API token, but GeoServer will NOT accept it
    as an Authorization header (403). It must be passed as ?authkey=<token>.
  * Workspace is sh_plnapp (not sh_planapp). Polygon layer pub_plnapppol,
    point layer pub_plnapppnt. Attributes: reference, local_auth.
  * &srsName=EPSG:4326 makes GeoServer reproject server-side (native is 27700),
    so no OSGB36 maths is needed. Coordinates come back as [lon, lat].
  * The dataset is large: always filter (CQL_FILTER on reference/local_auth).
  * Upstream caveat: some authorities supply buffered points rather than true
    red lines (East Ayrshire is documented as such), so geometry is validated
    rather than trusted.
"""
import json
import math
import os
import ssl
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT / "data" / "projects"
SOURCES = ROOT / "data" / "sources" / "sources.json"

WFS = "https://geo.spatialhub.scot/geoserver/sh_plnapp/wfs"
LAYER = "sh_plnapp:pub_plnapppol"
SOURCE_ID = "src-spatialhub-planning-applications"
TODAY = date.today().isoformat()

# Which application types represent the substantive scheme. Lower rank wins when
# several references match, so an application boundary beats a screening one.
TYPE_RANK = {
    "full_application": 0,
    "permission_in_principle": 0,
    "s36": 1,
    "s37": 1,
    "msc": 2,
    "variation": 2,
    "pan": 3,
    "eia_scoping": 4,
    "eia_screening": 5,
    "appeal": 6,
    "other": 7,
}

# Validation thresholds
MIN_AREA_M2 = 1_000          # below this the polygon is degenerate/a buffered point
MAX_CENTROID_DRIFT_KM = 12   # guards against a reference colliding in another authority
AREA_FLAG_RATIO = 0.25       # |official-recorded|/recorded above this is reported as a finding

_ctx = ssl.create_default_context()
for bundle in ("/root/.ccr/ca-bundle.crt",):
    try:
        _ctx.load_verify_locations(bundle)
    except Exception:
        pass


def wfs_get(cql, key):
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeName": LAYER,
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
        "authkey": key,
        "CQL_FILTER": cql,
    }
    url = f"{WFS}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=120, context=_ctx) as r:
        return json.loads(r.read())


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def area_m2(geom):
    """Planar area of a lon/lat polygon via local equirectangular projection."""
    polys = rings_of(geom)
    if not polys:
        return 0.0
    lats = [c[1] for poly in polys for ring in poly for c in ring]
    lat0 = sum(lats) / len(lats)
    kx = 111320.0 * math.cos(math.radians(lat0))
    ky = 110540.0

    def ring_area(ring):
        s = 0.0
        for i in range(len(ring) - 1):
            x1, y1 = ring[i][0] * kx, ring[i][1] * ky
            x2, y2 = ring[i + 1][0] * kx, ring[i + 1][1] * ky
            s += x1 * y2 - x2 * y1
        return abs(s) / 2

    total = 0.0
    for poly in polys:
        if not poly:
            continue
        total += ring_area(poly[0]) - sum(ring_area(h) for h in poly[1:])
    return total


def centroid(geom):
    pts = [c for poly in rings_of(geom) for ring in poly for c in ring]
    if not pts:
        return None
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def km_between(a, b):
    dx = (a[0] - b[0]) * 111.320 * math.cos(math.radians((a[1] + b[1]) / 2))
    dy = (a[1] - b[1]) * 110.540
    return math.hypot(dx, dy)


def load(path):
    return json.loads(path.read_text()) if path.exists() else None


def main():
    key = os.environ.get("SPATIALHUB_AUTHKEY")
    if not key:
        sys.exit("Set SPATIALHUB_AUTHKEY (see docs/GEOMETRY_AND_BOUNDARIES.md)")

    accepted, rejected, recon = [], [], []

    for pdir in sorted(p for p in PROJECTS.iterdir() if p.is_dir()):
        slug = pdir.name
        proj = load(pdir / "project.json")
        site = load(pdir / "site.json")
        cases = load(pdir / "planning_cases.json") or []
        if not proj or not site:
            continue
        if proj.get("is_sensitive"):
            rejected.append((slug, "-", "skipped: sensitive site, deliberately coarse"))
            continue

        refs = [(TYPE_RANK.get(c.get("application_type"), 9), c.get("reference"), c)
                for c in cases if c.get("reference")]
        refs.sort(key=lambda t: t[0])
        if not refs:
            rejected.append((slug, "-", "no planning reference held"))
            continue

        site_pt = None
        if site.get("longitude") is not None and site.get("latitude") is not None:
            site_pt = (site["longitude"], site["latitude"])
        recorded = (site.get("site_area_m2") or {}).get("value")

        features, primary = [], None
        for rank, ref, case in refs:
            try:
                fc = wfs_get(f"reference='{ref}'", key)
            except Exception as e:
                rejected.append((slug, ref, f"fetch error: {type(e).__name__}"))
                continue
            for feat in fc.get("features", []):
                geom = feat.get("geometry") or {}
                a = area_m2(geom)
                if a < MIN_AREA_M2:
                    rejected.append((slug, ref, f"degenerate geometry ({a:.0f} m2) — likely a buffered point upstream"))
                    continue
                cen = centroid(geom)
                if site_pt and cen:
                    drift = km_between(cen, site_pt)
                    if drift > MAX_CENTROID_DRIFT_KM:
                        rejected.append((slug, ref, f"centroid {drift:.1f} km from researched site point — probable reference collision"))
                        continue
                props = {
                    "slug": slug,
                    "reference": ref,
                    "local_auth": (feat.get("properties") or {}).get("local_auth"),
                    "application_type": case.get("application_type"),
                    "is_primary": primary is None,
                    "official_area_m2": round(a),
                    "source": "spatialhub_planning_applications_official",
                    "source_id": SOURCE_ID,
                    "licence": "OGL v3",
                    "retrieved_date": TODAY,
                }
                features.append({"type": "Feature", "geometry": geom, "properties": props})
                if primary is None:
                    primary = (ref, a, case)

        if not features or primary is None:
            continue

        geodir = pdir / "geo"
        geodir.mkdir(exist_ok=True)
        (geodir / "boundary.geojson").write_text(json.dumps(
            {"type": "FeatureCollection", "features": features}, indent=1) + "\n")

        site["boundary_precision"] = "red_line_official"
        (pdir / "site.json").write_text(json.dumps(site, indent=2, ensure_ascii=False) + "\n")

        ref, off_area, _ = primary
        accepted.append((slug, ref, off_area, len(features)))
        if recorded:
            delta = (off_area - recorded) / recorded
            recon.append((slug, ref, recorded, off_area, delta,
                          "FLAG" if abs(delta) > AREA_FLAG_RATIO else "ok"))
        else:
            recon.append((slug, ref, None, off_area, None, "no recorded area"))

    # Source ledger entry
    ledger = load(SOURCES) or []
    if not any(s.get("id") == SOURCE_ID for s in ledger):
        ledger.append({
            "id": SOURCE_ID,
            "title": "Planning Applications: Official (polygons) — sh_plnapp:pub_plnapppol",
            "publisher": "Improvement Service / Spatial Hub Scotland",
            "source_type": "map_or_gis",
            "url": "https://data.spatialhub.scot/dataset/planning_applications_official-is",
            "retrieved_date": TODAY,
            "reliability_tier": 1,
            "status": "active",
            "notes": ("Official red-line application boundaries supplied daily by all 34 Scottish "
                      "planning authorities. Open Government Licence v3. Accessed via WFS with "
                      "?authkey=; srsName=EPSG:4326. Some authorities supply buffered points rather "
                      "than true boundaries, so geometry is validated before use."),
        })
        SOURCES.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n")

    print(f"\nACCEPTED {len(accepted)} project(s) with official boundaries")
    for slug, ref, a, n in accepted:
        print(f"  {slug:22} {ref:20} {a/10000:8.1f} ha  ({n} feature(s))")

    print(f"\nNO BOUNDARY / REJECTED {len(rejected)}")
    for slug, ref, why in rejected:
        print(f"  {slug:22} {ref:20} {why}")

    print("\nAREA RECONCILIATION (official red line vs researched site_area_m2)")
    print(f"  {'slug':22} {'recorded':>10} {'official':>10} {'delta':>9}")
    for slug, ref, rec, off, delta, status in sorted(recon, key=lambda r: -(abs(r[4]) if r[4] is not None else 0)):
        r = f"{rec/10000:.1f} ha" if rec else "—"
        d = f"{delta*100:+.1f}%" if delta is not None else "—"
        print(f"  {slug:22} {r:>10} {off/10000:7.1f} ha {d:>9}  {status}")


if __name__ == "__main__":
    main()
