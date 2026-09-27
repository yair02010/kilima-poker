#!/usr/bin/env python3
"""Check that the prose API documents and the machine-readable specs agree.

- Every (method, path) in KP-ENG-02 §9 and KP-ENG-03 tables exists in specs/openapi.yaml, and vice versa.
- Every real-time event named in KP-ENG-04 exists in specs/asyncapi.yaml, and vice versa.
Exit code 1 on any difference (used in CI)."""
import os, re, sys, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENG = os.path.join(ROOT, "03-engineering")


def doc_endpoints(path):
    out = set()
    for line in open(path, encoding="utf-8"):
        if not line.startswith("| "):
            continue
        cells = [c.strip() for c in re.split(r"(?<!\\)\|", line.strip()[1:-1])]
        if len(cells) < 2 or not re.fullmatch(r"(GET|POST|PUT|PATCH|DELETE)(/(GET|POST|PUT|PATCH|DELETE))*", cells[0]):
            continue
        methods = cells[0].lower().split("/")
        paths = re.findall(r"`([^`]+)`", cells[1])
        full = []
        for p in paths:
            p = p.split("?")[0]
            if full and p.count("/") == 1 and not p.startswith(("/auth", "/admin", "/players", "/wallet", "/cashier")):
                p = full[0].rsplit("/", 1)[0] + p          # relative suffix like `/resume`
            full.append(p)
        for m in methods:
            for p in full:
                out.add((m, p))
    return out


def spec_endpoints():
    spec = yaml.safe_load(open(os.path.join(ENG, "specs", "openapi.yaml")))
    return {(m, p) for p, ops in spec["paths"].items() for m in ops}


def doc_events(path):
    text = open(path, encoding="utf-8").read()
    return set(re.findall(r"`([a-z]+:[a-z_]+)`", text)) | set(re.findall(r"\b((?:hand|table|ff|tourn|lobby|session):[a-z_]+) \{", text))


def spec_events():
    spec = yaml.safe_load(open(os.path.join(ENG, "specs", "asyncapi.yaml")))
    return {c["address"] for c in spec["channels"].values()}


def main():
    ok = True
    docs = doc_endpoints(os.path.join(ENG, "03-api-specification.md")) | doc_endpoints(os.path.join(ENG, "02-identity-auth-service.md"))
    spec = spec_endpoints()
    for label, diff in (("in documents but not in openapi.yaml", docs - spec), ("in openapi.yaml but not in documents", spec - docs)):
        if diff:
            ok = False
            print("REST endpoints", label + ":")
            for m, p in sorted(diff, key=lambda x: (x[1], x[0])):
                print("   ", m.upper(), p)
    ev_doc = doc_events(os.path.join(ENG, "04-realtime-protocol.md"))
    ev_spec = spec_events()
    for label, diff in (("in KP-ENG-04 but not in asyncapi.yaml", ev_doc - ev_spec), ("in asyncapi.yaml but not in KP-ENG-04", ev_spec - ev_doc)):
        if diff:
            ok = False
            print("Events", label + ":", ", ".join(sorted(diff)))
    print("REST: %d documented, %d in spec · events: %d documented, %d in spec" % (len(docs), len(spec), len(ev_doc), len(ev_spec)))
    print("CONSISTENT" if ok else "INCONSISTENT")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
