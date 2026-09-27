#!/usr/bin/env python3
"""Derive the delivery-tracking baseline (milestones, work packages, teams, gate checklist items, risks)
from the dossier documents, so the Work hub of the documentation site starts from the plan of record.

    python3 tools/work_seed.py        → site/work_baseline.json  (+ site/seed/<collection>/<id>.json files)

The baseline is embedded read-only in the site; the live tracker keeps its state in the artifact's
shared database, seeded once from site/seed/."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site")

START_DATE = "2026-10-05"   # programme month 1 starts (Monday); editable in the tracker (config/programme)

MILESTONES = [
    ("M1", "Foundations", 1, 2, ""),
    ("M2", "Game core", 3, 4, ""),
    ("M3", "Tournaments and Alpha", 5, 6, "Alpha"),
    ("M4", "Beta hardening", 7, 8, "G1"),
    ("M5", "Real Money build", 7, 10, "G2"),
    ("M6", "Launch readiness", 10, 12, "G3"),
    ("M7", "Network (R2)", 13, 18, "G4"),
]

TEAMS = [
    ("GAM", "Game", "engine-poker, table-server, lobby, tournament, rng"),
    ("PLT", "Platform", "gateway, identity, player, notify, shared packages, developer experience"),
    ("PAY", "Payments", "wallet, cashier, ledger postings, reconciliation tooling"),
    ("TRU", "Trust", "compliance, integrity services, back-office risk tools"),
    ("CLI", "Clients", "mobile, web, table renderer, white-label"),
    ("DAT", "Data", "data platform, reports, ML"),
    ("SRE", "SRE / Security", "infrastructure, CI/CD, observability, security engineering"),
    ("QA", "Quality", "test strategy, certification testing, release quality"),
    ("OPS", "Operations", "support, game operations, player care, treasury operations"),
]


def cells(line):
    return [c.strip() for c in re.split(r"(?<!\\)\|", line.strip()[1:-1])]


def work_packages():
    text = open(os.path.join(ROOT, "09-handbook", "06-build-plan.md"), encoding="utf-8").read()
    wps, ms = [], None
    for ln in text.split("\n"):
        m = re.match(r"# \d+\. Milestone (M\d)", ln)
        if m:
            ms = m.group(1)
        if ln.startswith("| WP-") and ms:
            c = cells(ln)
            code, title, team, deps, done = c[0], c[1], c[2], c[3], c[4]
            teams = [t.strip() for t in re.split(r"[+/]", team) if t.strip()]
            teams = ["QA" if t == "QA" else ("OPS" if t in ("Ops", "All") else t) for t in teams]
            dep_list = re.findall(r"WP-\d+", deps)
            mrow = next(x for x in MILESTONES if x[0] == ms)
            wps.append({"code": code, "title": title, "teams": teams, "milestone": ms, "dependsOn": dep_list,
                        "dependsNote": "" if dep_list or deps in ("—", "") else deps, "doneWhen": done,
                        "status": "not_started", "progress": 0, "ownerId": None,
                        "startMonth": mrow[2], "endMonth": mrow[3], "notes": "", "order": int(code[3:])})
    return wps


def gate_items():
    text = open(os.path.join(ROOT, "06-operations", "06-go-live-readiness.md"), encoding="utf-8").read()
    items, gate, section, n = [], None, "", {}
    for ln in text.split("\n"):
        m = re.match(r"# \d+\. (G\d) — (.*)", ln)
        if m:
            gate = m.group(1); section = m.group(2); continue
        if ln.startswith("# "):
            gate = None; continue
        m = re.match(r"## (.*)", ln)
        if m and gate:
            section = m.group(1); continue
        if ln.startswith("- [ ] ") and gate:
            n[gate] = n.get(gate, 0) + 1
            items.append({"id": f"{gate}-{n[gate]:02d}", "gate": gate, "section": section, "text": ln[6:].strip(),
                          "done": False, "doneBy": None, "doneAt": None, "evidence": "", "order": n[gate]})
    return items


def risks():
    text = open(os.path.join(ROOT, "02-project", "03-risk-register.md"), encoding="utf-8").read()
    out = []
    for ln in text.split("\n"):
        if re.match(r"\| R\d\d ", ln):
            c = cells(ln)
            out.append({"code": c[0], "title": c[1], "likelihood": int(c[2]), "impact": int(c[3]), "mitigation": c[5],
                        "ownerRole": c[6], "status": "open", "notes": ""})
    return out


GATES = [
    {"code": "G1", "title": "Play Money Beta", "milestone": "M4"},
    {"code": "G2", "title": "Certification readiness", "milestone": "M5"},
    {"code": "G3", "title": "Real Money launch", "milestone": "M6"},
]


def build():
    wps = work_packages(); gates = gate_items(); rs = risks()
    baseline = {
        "startDate": START_DATE,
        "milestones": [{"code": c, "title": t, "startMonth": a, "endMonth": b, "gate": g} for c, t, a, b, g in MILESTONES],
        "teams": [{"code": c, "name": n, "scope": s, "leadId": None, "memberIds": []} for c, n, s in TEAMS],
        "workpackages": wps, "gateitems": gates, "gates": GATES, "risks": rs,
    }
    os.makedirs(OUT, exist_ok=True)
    json.dump(baseline, open(os.path.join(OUT, "work_baseline.json"), "w"), indent=1)
    seed = os.path.join(OUT, "seed")
    for coll, rows, key in (("workpackages", wps, "code"), ("gateitems", gates, "id"), ("risks", rs, "code"),
                            ("teams", baseline["teams"], "code"), ("milestones", baseline["milestones"], "code")):
        os.makedirs(os.path.join(seed, coll), exist_ok=True)
        for r in rows:
            json.dump(r, open(os.path.join(seed, coll, r[key] + ".json"), "w"))
    os.makedirs(os.path.join(seed, "config"), exist_ok=True)
    json.dump({"startDate": START_DATE, "sprintDays": 14}, open(os.path.join(seed, "config", "programme.json"), "w"))
    print(f"baseline: {len(wps)} work packages, {len(gates)} gate items, {len(rs)} risks, {len(TEAMS)} teams")
    return baseline


if __name__ == "__main__":
    build()
