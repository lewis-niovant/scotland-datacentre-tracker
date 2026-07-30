#!/usr/bin/env python3
"""Validate the Observatory dataset against its JSON Schemas and check referential integrity.

Usage: python3 scripts/validate.py
Exit code 0 = valid; 1 = errors found.
"""
import json
import re
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
    from referencing import Registry, Resource
except ImportError:
    sys.exit("Missing deps: pip install jsonschema referencing")

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "data" / "schema"
PROJECTS_DIR = ROOT / "data" / "projects"
SOURCES_FILE = ROOT / "data" / "sources" / "sources.json"

# project-folder file -> schema file (all optional except project.json)
FILE_SCHEMAS = {
    "project.json": "project.schema.json",
    "site.json": "site.schema.json",
    "capacity_claims.json": "capacity_claims.schema.json",
    "energy_estimates.json": "energy_estimates.schema.json",
    "water_estimates.json": "water_estimates.schema.json",
    "economic_claims.json": "economic_claims.schema.json",
    "planning_cases.json": "planning_cases.schema.json",
    "organisations.json": "organisations.schema.json",
    "community.json": "community.schema.json",
    "grid.json": "grid.schema.json",
}

SOURCE_ID_RE = re.compile(r'"(src-[a-z0-9-]+)"')


def build_registry():
    resources = []
    for schema_path in SCHEMA_DIR.glob("*.schema.json"):
        schema = json.loads(schema_path.read_text())
        resources.append((schema["$id"], Resource.from_contents(schema)))
    return Registry().with_resources(resources)


def load_json(path, errors):
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as e:
        errors.append(f"{path.relative_to(ROOT)}: invalid JSON — {e}")
        return None


def main():
    errors = []
    warnings = []
    registry = build_registry()

    def validator_for(schema_name):
        schema = json.loads((SCHEMA_DIR / schema_name).read_text())
        return Draft202012Validator(schema, registry=registry)

    validators = {f: validator_for(s) for f, s in FILE_SCHEMAS.items()}

    # Sources ledger
    known_source_ids = set()
    if SOURCES_FILE.exists():
        sources = load_json(SOURCES_FILE, errors)
        if sources is not None:
            v = validator_for("sources.schema.json")
            for err in v.iter_errors(sources):
                errors.append(f"sources.json: {'/'.join(map(str, err.path))}: {err.message}")
            ids = [s.get("id") for s in sources if isinstance(s, dict)]
            dupes = {i for i in ids if ids.count(i) > 1}
            if dupes:
                errors.append(f"sources.json: duplicate source ids: {sorted(dupes)}")
            known_source_ids = set(filter(None, ids))
    else:
        warnings.append("No sources ledger yet (data/sources/sources.json)")

    # Projects
    slugs = set()
    project_dirs = sorted(p for p in PROJECTS_DIR.iterdir() if p.is_dir()) if PROJECTS_DIR.exists() else []
    for pdir in project_dirs:
        rel = pdir.relative_to(ROOT)
        if not (pdir / "project.json").exists():
            errors.append(f"{rel}: missing required project.json")
            continue
        used_source_ids = set()
        for fname, validator in validators.items():
            fpath = pdir / fname
            if not fpath.exists():
                continue
            data = load_json(fpath, errors)
            if data is None:
                continue
            for err in validator.iter_errors(data):
                errors.append(f"{rel}/{fname}: {'/'.join(map(str, err.path))}: {err.message}")
            used_source_ids |= set(SOURCE_ID_RE.findall(fpath.read_text()))
        # slug consistency
        proj = load_json(pdir / "project.json", errors)
        if proj:
            slug = proj.get("slug")
            if slug != pdir.name:
                errors.append(f"{rel}: slug '{slug}' != folder name '{pdir.name}'")
            slugs.add(slug)
        # source references resolve
        missing = used_source_ids - known_source_ids
        if missing:
            errors.append(f"{rel}: unknown source ids: {sorted(missing)}")
        # geo files parse if present
        for geo in (pdir / "geo").glob("*.geojson") if (pdir / "geo").exists() else []:
            g = load_json(geo, errors)
            if g and g.get("type") not in ("FeatureCollection", "Feature"):
                errors.append(f"{geo.relative_to(ROOT)}: not a GeoJSON Feature/FeatureCollection")

    # related_project_slugs resolve
    for pdir in project_dirs:
        proj_path = pdir / "project.json"
        if not proj_path.exists():
            continue
        proj = load_json(proj_path, [])
        if proj:
            for r in proj.get("related_project_slugs", []):
                if r not in slugs:
                    errors.append(f"{pdir.relative_to(ROOT)}: related project '{r}' not found")

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"\n{len(project_dirs)} project(s), {len(known_source_ids)} source(s): "
          f"{'FAIL — ' + str(len(errors)) + ' error(s)' if errors else 'OK'}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
