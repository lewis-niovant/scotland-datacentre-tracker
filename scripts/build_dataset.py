#!/usr/bin/env python3
"""Compile data/ into app/public/data/ for the static site.

Outputs:
  app/public/data/observatory.json  — all projects with embedded records + constants + sources
  app/public/data/geo.json          — FeatureCollection: one point per project + boundary/building
                                      features + derived projected extents

Three tiers of site extent are published:
  1. `kind: "boundary"`          — official red line, researched and committed under data/projects/.
  2. `kind: "projected_extent"`, `tier: 2` — DERIVED HERE, never committed: a square of the
     sourced site area centred on a reliably-recorded point. The area is sourced; the shape,
     orientation and parcel are not.
  3. `kind: "projected_extent"`, `tier: 3` — same, but the location is only known to settlement
     level, so the square shows how big the site is, not where it is.

Nothing in tiers 2/3 is written back into data/projects/, so a projection can never be mistaken
for research output, and `boundary_precision` stays honestly "none".
"""
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS_DIR = ROOT / "data" / "projects"
OUT_DIR = ROOT / "app" / "public" / "data"

RECORD_FILES = [
    "site", "capacity_claims", "energy_estimates", "water_estimates",
    "economic_claims", "planning_cases", "organisations", "community", "grid",
]


def load(path):
    return json.loads(path.read_text()) if path.exists() else None


# Location precisions good enough to place a square honestly, vs the weak one that is not.
TIER2_PRECISIONS = {"exact", "site_centroid", "approximate"}
TIER3_PRECISIONS = {"settlement_level"}


def projected_extent(slug, site, is_sensitive):
    """A square of side sqrt(area) centred on the site point, or None.

    Only ever called for projects with no official boundary. Returns a Feature whose
    properties say plainly that it is derived.
    """
    if is_sensitive:
        return None  # a drawn extent would contradict the deliberate coarse location policy
    lat, lon = site.get("latitude"), site.get("longitude")
    area = (site.get("site_area_m2") or {}).get("value")
    precision = site.get("location_precision")
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return None
    if not isinstance(area, (int, float)) or area <= 0:
        return None  # never invent an area: no figure means no extent
    if precision in TIER2_PRECISIONS:
        tier = 2
    elif precision in TIER3_PRECISIONS:
        tier = 3
    else:
        return None

    side = math.sqrt(area)
    dlat = (side / 2) / 111320
    dlon = (side / 2) / (111320 * math.cos(math.radians(lat)))
    x0, x1 = lon - dlon, lon + dlon
    y0, y1 = lat - dlat, lat + dlat
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
        },
        "properties": {
            "slug": slug,
            "kind": "projected_extent",
            "tier": tier,
            "derived": True,
            "area_m2": area,
            "area_state": (site.get("site_area_m2") or {}).get("state"),
            "side_m": round(side, 1),
            "location_precision": precision,
            "centre": [lon, lat],
        },
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    constants = load(ROOT / "data" / "constants.json")
    sources = load(ROOT / "data" / "sources" / "sources.json") or []

    projects = []
    geo_features = []

    for pdir in sorted(PROJECTS_DIR.iterdir()) if PROJECTS_DIR.exists() else []:
        if not pdir.is_dir() or not (pdir / "project.json").exists():
            continue
        record = {"project": load(pdir / "project.json")}
        for name in RECORD_FILES:
            data = load(pdir / f"{name}.json")
            if data is not None:
                record[name] = data
        slug = record["project"]["slug"]
        projects.append(record)

        site = record.get("site") or {}
        if "latitude" in site and "longitude" in site:
            geo_features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [site["longitude"], site["latitude"]]},
                "properties": {
                    "slug": slug,
                    "kind": "project_point",
                    "name": record["project"].get("display_name") or record["project"]["canonical_name"],
                    "status": record["project"]["status"],
                    "maturity": record["project"]["maturity_level"],
                    "location_precision": site.get("location_precision"),
                },
            })
        has_boundary = False
        for geo_name, kind in (("boundary", "boundary"), ("buildings", "building")):
            g = load(pdir / "geo" / f"{geo_name}.geojson")
            if g:
                feats = g["features"] if g.get("type") == "FeatureCollection" else [g]
                if kind == "boundary" and feats:
                    has_boundary = True
                for f in feats:
                    f.setdefault("properties", {})
                    f["properties"].update({"slug": slug, "kind": kind})
                    geo_features.append(f)

        # Tiers 2/3 only where tier 1 is absent — a projection never competes with a red line.
        if not has_boundary:
            ext = projected_extent(slug, site, record["project"].get("is_sensitive"))
            if ext:
                geo_features.append(ext)

    payload = {
        "generated_from_snapshot": constants.get("snapshot_date") if constants else None,
        "constants": constants,
        "projects": projects,
        "sources": {s["id"]: s for s in sources},
    }
    (OUT_DIR / "observatory.json").write_text(json.dumps(payload, ensure_ascii=False))
    (OUT_DIR / "geo.json").write_text(json.dumps(
        {"type": "FeatureCollection", "features": geo_features}, ensure_ascii=False))
    kinds = Counter(f["properties"].get("kind") for f in geo_features)
    tiers = Counter(
        f["properties"].get("tier") for f in geo_features
        if f["properties"].get("kind") == "projected_extent"
    )
    with_boundary = len({f["properties"]["slug"] for f in geo_features
                         if f["properties"].get("kind") == "boundary"})
    print(f"Built {len(projects)} project(s), {len(geo_features)} geo feature(s) -> {OUT_DIR.relative_to(ROOT)}")
    for kind, n in sorted(kinds.items(), key=lambda kv: str(kv[0])):
        print(f"  {kind}: {n}")
    print(f"  extents — tier 1 official boundary: {with_boundary} project(s); "
          f"tier 2 projected: {tiers[2]}; tier 3 projected (settlement-level): {tiers[3]}; "
          f"no extent: {len(projects) - with_boundary - tiers[2] - tiers[3]}")


if __name__ == "__main__":
    main()
