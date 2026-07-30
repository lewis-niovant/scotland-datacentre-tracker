#!/usr/bin/env python3
"""Probe OpenStreetMap for building footprints at operating data centre sites.

Run MANUALLY, never in CI:

    python3 scripts/fetch_osm_footprints.py            # report only
    python3 scripts/fetch_osm_footprints.py --write    # write reviewed slugs

Why this exists
---------------
Operating facilities predate the planning portal, so Spatial Hub holds no red
line for them and they show no extent at all. OSM often does hold a real surveyed
building outline, which is a genuine sourced footprint rather than an inference
from an area figure.

It is NOT a planning boundary and must never be drawn as one. Anything written
here is tagged `kind: "osm_footprint"` so the app can style and caption it as its
own tier: what is actually built, from OpenStreetMap contributors, ODbL.

Judgement this script deliberately does not automate
----------------------------------------------------
A point-in-building match is not the same as "this building is the data centre".
Where a facility occupies part of a shared block — a basement suite in a city
centre office tower, say — the enclosing OSM building is the tower, and
publishing it would overstate the facility by an order of magnitude. So the
script reports candidates with their areas and tags, and only writes the slugs
listed in REVIEWED below, each with the reason it was accepted.
"""
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT / "data" / "projects"
OVERPASS = "https://overpass-api.de/api/interpreter"
TODAY = date.today().isoformat()

# Sites with no official boundary where an OSM outline could plausibly exist.
CANDIDATES = [
    "brightsolid-aberdeen",
    "datavita-dv2",
    "pulsant-south-gyle",
    "greenock-spango",
    "iomart-glasgow",
]

# Slugs cleared for writing, with the reason. Everything else is report-only.
REVIEWED: dict[str, str] = {
    # Two adjacent buildings carry building=data_center AND the operator's own
    # facility name ("Pulsant Edinburgh South Gyle SC-1"). That is a named,
    # surveyed match, not a proximity guess.
    "pulsant-south-gyle": "OSM buildings tagged building=data_center and named for this facility",
    # Same standard: building=data_center, named "iomart Glasgow Data Centre".
    # Note the nearest building to the recorded point is a larger untagged
    # industrial shed 5 m away — proximity alone would have picked the wrong one.
    "iomart-glasgow": "OSM building tagged building=data_center and named for this facility",
    # Deliberately NOT written, and why:
    #   datavita-dv2  — the record is a basement suite at 177 Bothwell Street; the
    #     enclosing OSM building is the whole office block, so publishing it would
    #     overstate the facility by an order of magnitude.
    #   brightsolid-aberdeen — nearest building is untagged and unnamed on an
    #     industrial estate shared with unrelated occupiers. Plausible, not evidence.
}

SEARCH_RADIUS_M = 220
# Above this, a single "building" at a city-centre address is almost certainly a
# whole block or estate rather than the facility itself.
SANITY_MAX_M2 = 60000


def load(path):
    return json.loads(path.read_text()) if path.exists() else None


def query(lat, lon, radius):
    q = f"""
[out:json][timeout:60];
(
  way["building"](around:{radius},{lat},{lon});
  relation["building"](around:{radius},{lat},{lon});
);
out geom tags;
"""
    # Overpass is a free shared service that returns 429/504 under load. Back off
    # rather than giving up: a failed query here reads as "no building exists",
    # which is a materially different claim.
    last = None
    for attempt in range(5):
        req = urllib.request.Request(
            OVERPASS,
            data=urllib.parse.urlencode({"data": q}).encode(),
            headers={"User-Agent": "scotland-datacentre-tracker/1.0 (research; contact via repo)"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as exc:  # noqa: BLE001 — retried below
            last = exc
            wait = 15 * (attempt + 1)
            print(f"    (attempt {attempt + 1} failed: {exc}; retrying in {wait}s)")
            time.sleep(wait)
    raise last


def ring_of(el):
    if el["type"] == "way":
        return [[p["lon"], p["lat"]] for p in el.get("geometry", [])]
    for m in el.get("members", []):
        if m.get("role") == "outer" and m.get("geometry"):
            return [[p["lon"], p["lat"]] for p in m["geometry"]]
    return []


def area_m2(ring):
    """Planar shoelace on a local equirectangular projection — fine at building scale."""
    if len(ring) < 4:
        return 0.0
    lat0 = sum(p[1] for p in ring) / len(ring)
    kx = 111320 * math.cos(math.radians(lat0))
    ky = 110540
    a = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i][0] * kx, ring[i][1] * ky
        x2, y2 = ring[i - 1][0] * kx, ring[i - 1][1] * ky
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def centre_of(ring):
    return [sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)]


def dist_m(a, b):
    return math.hypot(
        (a[0] - b[0]) * 111320 * math.cos(math.radians((a[1] + b[1]) / 2)),
        (a[1] - b[1]) * 110540,
    )


def main():
    write = "--write" in sys.argv
    for slug in CANDIDATES:
        site = load(PROJECTS / slug / "site.json") or {}
        lat, lon = site.get("latitude"), site.get("longitude")
        if lat is None or lon is None:
            print(f"\n{slug}: no coordinates, skipped")
            continue
        print(f"\n{slug}  ({lat:.5f}, {lon:.5f})  {site.get('address', '')}")
        try:
            data = query(lat, lon, SEARCH_RADIUS_M)
        except Exception as exc:  # noqa: BLE001 — a manual research tool
            print(f"  query failed: {exc}")
            continue
        rows = []
        for el in data.get("elements", []):
            ring = ring_of(el)
            if len(ring) < 4:
                continue
            a = area_m2(ring)
            if a < 150:
                continue
            rows.append((dist_m(centre_of(ring), [lon, lat]), a, el, ring))
        rows.sort(key=lambda r: r[0])
        if not rows:
            print("  no OSM buildings within radius")
            continue
        for d, a, el, _ in rows[:6]:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("operator") or ""
            flag = "  <-- larger than a single facility" if a > SANITY_MAX_M2 else ""
            print(f"  {d:6.0f} m  {a:9.0f} m²  building={tags.get('building')}  "
                  f"{name[:44]}{flag}")

        if write and slug in REVIEWED:
            # A facility is often several halls. Prefer every building the
            # surveyors tagged as a data centre; fall back to the nearest only
            # when none is tagged.
            tagged = [r for r in rows if r[2].get("tags", {}).get("building") == "data_center"]
            chosen = tagged or rows[:1]
            out = PROJECTS / slug / "geo"
            out.mkdir(parents=True, exist_ok=True)
            feats = []
            for _, a, el, ring in chosen:
                if ring[0] != ring[-1]:
                    ring = ring + [ring[0]]
                feats.append({
                    "type": "Feature",
                    "geometry": {"type": "Polygon", "coordinates": [ring]},
                    "properties": {
                        "kind": "osm_footprint",
                        "area_m2": round(a),
                        "name": el.get("tags", {}).get("name"),
                        "osm_type": el["type"],
                        "osm_id": el["id"],
                        "retrieved_date": TODAY,
                        "licence": "ODbL — (c) OpenStreetMap contributors",
                        "review_note": REVIEWED[slug],
                    },
                })
            (out / "osm_footprint.geojson").write_text(
                json.dumps({"type": "FeatureCollection", "features": feats}, indent=2))
            print(f"  written: {len(feats)} footprint(s) -> {out / 'osm_footprint.geojson'}")
        time.sleep(2)  # Overpass is a shared free service; do not hammer it

    if not write:
        print("\nReport only. Add cleared slugs to REVIEWED, then re-run with --write.")


if __name__ == "__main__":
    main()
