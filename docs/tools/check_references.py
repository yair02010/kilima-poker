#!/usr/bin/env python3
"""Check that every document ID (KP-XXX-NN) and ADR number referenced in the dossier exists,
and that every @widths line matches its table's column count. Exit 1 on problems (CI job `dossier-refs`)."""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from render import front_matter

files = sorted(glob.glob(os.path.join(ROOT, "[0-9][0-9]-*", "**", "*.md"), recursive=True))
ids = set()
for f in files:
    meta, _ = front_matter(open(f, encoding="utf-8").read())
    if meta.get("id"):
        if meta["id"] in ids:
            print("DUPLICATE id", meta["id"], f)
        ids.add(meta["id"])
ids.add("KP-GOV-00")
adrs = {os.path.basename(p)[:4] for p in glob.glob(os.path.join(ROOT, "03-engineering", "adr", "*.md"))}

problems = 0
for f in files + [os.path.join(ROOT, "README.md")] if os.path.exists(os.path.join(ROOT, "README.md")) else files:
    text = open(f, encoding="utf-8").read()
    rel = os.path.relpath(f, ROOT)
    for ref in sorted(set(re.findall(r"\bKP-(?:GOV|PRD|PRJ|ENG|QA|SEC|OPS|LEG|FIN|HBK)-\d{2}\b", text))):
        if ref not in ids:
            print(f"{rel}: unknown document {ref}"); problems += 1
    for n in sorted(set(re.findall(r"\bADR-(\d{4})\b", text))):
        if n not in adrs:
            print(f"{rel}: unknown ADR-{n}"); problems += 1
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        if ln.startswith("@widths "):
            n = len(ln[8:].split(","))
            j = i + 1
            if j < len(lines) and lines[j].startswith("|"):
                cols = len(re.split(r"(?<!\\)\|", lines[j].strip()[1:-1]))
                if cols != n:
                    print(f"{rel}:{i+1}: @widths has {n} values for {cols} columns"); problems += 1
print(f"{len(ids)} documents, {len(adrs)} ADRs, {len(files)} files checked — {'OK' if not problems else str(problems) + ' problem(s)'}")
sys.exit(1 if problems else 0)
