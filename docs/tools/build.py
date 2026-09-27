"""Build every Markdown document in the dossier into a styled PDF under dist/pdf/.
Usage: python3 tools/build.py [path-filter]"""
import os, sys, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import render, diagrams
OUT = os.path.join(ROOT, "dist", "pdf")
EXTRA = {"arch": diagrams.arch}
flt = sys.argv[1] if len(sys.argv) > 1 else ""
os.makedirs(OUT, exist_ok=True)
files = sorted(glob.glob(os.path.join(ROOT, "[0-9][0-9]-*", "**", "*.md"), recursive=True))
files = [f for f in files if flt in f and "/adr/" not in f and "/reference/" not in f and "/data/" not in f and not f.endswith("README.md")]
for f in files:
    meta, _ = render.front_matter(open(f, encoding="utf-8").read())
    safe = "".join(c if c.isalnum() else "_" for c in meta.get("title", "doc")).strip("_")
    while "__" in safe: safe = safe.replace("__", "_")
    name = "%s_%s.pdf" % (meta.get("id", "KP"), safe)
    render.build_file(f, os.path.join(OUT, name), EXTRA)
    print("built", name)
