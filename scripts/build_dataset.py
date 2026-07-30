#!/usr/bin/env python3
"""Compile data/ into app/public/data/ for the static site.

Outputs:
  app/public/data/observatory.json  — all projects with embedded records + constants + sources
  app/public/data/geo.json          — FeatureCollection: one point per project + boundary/building features
"""
import json
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
        for geo_name, kind in (("boundary", "boundary"), ("buildings", "building")):
            g = load(pdir / "geo" / f"{geo_name}.geojson")
            if g:
                feats = g["features"] if g.get("type") == "FeatureCollection" else [g]
                for f in feats:
                    f.setdefault("properties", {})
                    f["properties"].update({"slug": slug, "kind": kind})
                    geo_features.append(f)

    payload = {
        "generated_from_snapshot": constants.get("snapshot_date") if constants else None,
        "constants": constants,
        "projects": projects,
        "sources": {s["id"]: s for s in sources},
    }
    (OUT_DIR / "observatory.json").write_text(json.dumps(payload, ensure_ascii=False))
    (OUT_DIR / "geo.json").write_text(json.dumps(
        {"type": "FeatureCollection", "features": geo_features}, ensure_ascii=False))
    print(f"Built {len(projects)} project(s), {len(geo_features)} geo feature(s) -> {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
