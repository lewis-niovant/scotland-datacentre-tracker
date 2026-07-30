#!/usr/bin/env python3
"""Merge per-project sources.json files into the global ledger, then delete them.

Research agents write data/projects/<slug>/sources.json to avoid concurrent
edits to the global ledger; this script folds them in (id collision = keep
existing global entry, warn if contents differ).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLOBAL = ROOT / "data" / "sources" / "sources.json"

ledger = json.loads(GLOBAL.read_text())
by_id = {s["id"]: s for s in ledger}
merged_files = 0
added = 0

for local in sorted(ROOT.glob("data/projects/*/sources.json")):
    entries = json.loads(local.read_text())
    for e in entries:
        if e["id"] in by_id:
            if e != by_id[e["id"]]:
                print(f"WARN {local.parent.name}: id {e['id']} already in ledger with different content — keeping global")
        else:
            ledger.append(e)
            by_id[e["id"]] = e
            added += 1
    local.unlink()
    merged_files += 1

GLOBAL.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n")
print(f"Merged {merged_files} file(s), added {added} source(s); ledger now {len(ledger)}")
