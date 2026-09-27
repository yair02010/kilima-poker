#!/usr/bin/env python3
"""Build the Kilima Engineering documentation site: one self-contained HTML page with every dossier document,
the engineering handbook, ADRs, an API and protocol reference generated from the specs, and the engine test vectors.

Usage:  python3 tools/build_site.py            → site/index.html (page body, for the Artifact publisher)
                                                  site/preview.html (full HTML document for local preview)
Requires: markdown, pyyaml, reportlab; mermaid-cli (npx) for diagrams (cached in site/.mermaid-cache)."""
import glob, hashlib, html, json, os, re, subprocess, sys
import markdown, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from render import front_matter  # noqa: E402

OUT = os.path.join(ROOT, "site")
CACHE = os.path.join(OUT, ".mermaid-cache")
os.makedirs(CACHE, exist_ok=True)

SECTIONS = [  # (folder, nav label, short)
    ("09-handbook", "Engineering Handbook", "HBK"),
    ("01-product", "Product", "PRD"),
    ("02-project", "Project", "PRJ"),
    ("03-engineering", "Engineering", "ENG"),
    ("04-quality", "Quality", "QA"),
    ("05-security", "Security", "SEC"),
    ("06-operations", "Operations", "OPS"),
    ("08-finance", "Finance & Treasury", "FIN"),
    ("07-legal-compliance", "Legal & Compliance", "LEG"),
    ("00-governance", "Governance", "GOV"),
]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def anchor_of(doc_id):
    return slug(doc_id)


# ------------------------------------------------------------------------------------------------ mermaid
MERMAID_CFG = {"theme": "base", "themeVariables": {
    "primaryColor": "#EAF0FB", "primaryBorderColor": "#2F63D0", "primaryTextColor": "#16203A",
    "lineColor": "#5A6581", "secondaryColor": "#FFF4D6", "tertiaryColor": "#F5F7FB",
    "fontFamily": "IBM Plex Sans, Segoe UI, sans-serif", "fontSize": "14px"}}


def mermaid_svg(src):
    h = hashlib.sha1(src.encode()).hexdigest()[:12]
    path = os.path.join(CACHE, h + ".svg")
    if not os.path.exists(path):
        mmd = os.path.join(CACHE, h + ".mmd")
        open(mmd, "w").write(src)
        cfg = os.path.join(CACHE, "cfg.json"); json.dump(MERMAID_CFG, open(cfg, "w"))
        pp = os.path.join(CACHE, "pp.json")
        json.dump({"executablePath": "/opt/pw-browsers/chromium", "args": ["--no-sandbox"]}, open(pp, "w"))
        subprocess.run(["npx", "-y", "@mermaid-js/mermaid-cli@11", "-p", pp, "-c", cfg, "-i", mmd, "-o", path,
                        "-b", "transparent", "-I", "mmd-" + h], check=True, capture_output=True)
    svg = open(path).read()
    svg = re.sub(r"^<\?xml[^>]*>", "", svg).strip()
    return f'<figure class="diagram mermaid-fig">{svg}</figure>'


def arch_svg():
    from reportlab.graphics import renderSVG
    import diagrams
    s = renderSVG.drawToString(diagrams.arch())
    s = re.sub(r"^<\?xml[^>]*>\s*(<!DOCTYPE[^>]*>)?", "", s).strip()
    s = s.replace('font-family="Sans-B"', 'font-family="IBM Plex Sans" font-weight="600"').replace('font-family="Sans"', 'font-family="IBM Plex Sans"')
    s = re.sub(r'<svg([^>]*?)width="[^"]*" height="[^"]*"', r'<svg\1', s, count=1)
    return f'<figure class="diagram arch-fig">{s}<figcaption>Kilima Poker platform — services, event bus and data stores (KP-ENG-01 §5)</figcaption></figure>'


# ------------------------------------------------------------------------------------------------ markdown
def preprocess(body, doc_dir):
    lines = body.split("\n")
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("```mermaid"):
            j = i + 1; buf = []
            while not lines[j].startswith("```"):
                buf.append(lines[j]); j += 1
            out += ["", mermaid_svg("\n".join(buf)), ""]; i = j + 1; continue
        if ln.startswith("```"):
            out.append(ln); i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                out.append(lines[i]); i += 1
            if i < len(lines):
                out.append(lines[i]); i += 1
            continue
        if ln.startswith("@widths ") or ln.strip() == "@pagebreak":
            i += 1; continue
        if ln.startswith("@diagram arch"):
            out += ["", arch_svg(), ""]; i += 1; continue
        if ln.startswith("@include adr"):
            for fp in sorted(glob.glob(os.path.join(doc_dir, "adr", "*.md"))):
                txt = open(fp, encoding="utf-8").read()
                txt = re.sub(r"^## ", "### ", txt, flags=re.M)
                txt = re.sub(r"^# ", "# ", txt, flags=re.M)
                out += preprocess(txt, doc_dir).split("\n") + [""]
            i += 1; continue
        if ln.startswith("!> ") or ln.startswith("> "):
            warn = ln.startswith("!")
            buf = []
            while i < len(lines) and (lines[i].startswith("> ") or lines[i].startswith("!> ")):
                buf.append(lines[i].split("> ", 1)[1]); i += 1
            cls = "callout warn" if warn else "callout"
            out += ["", f'<div class="{cls}" markdown="1">', "", " ".join(buf), "", "</div>", ""]
            continue
        # python-markdown needs a blank line before lists and tables
        is_item = re.match(r"(- |\d+\. |\|)", ln)
        if is_item and out and out[-1].strip() and not re.match(r"(\s*- |\s*\d+\. |\|)", out[-1]):
            out.append("")
        if ln.startswith("  - "):
            ln = "    - " + ln[4:]
        out.append(ln); i += 1
    return "\n".join(out)


MD = markdown.Markdown(extensions=["tables", "fenced_code", "md_in_html", "sane_lists", "attr_list"])


def md_to_html(body, doc_dir, doc_anchor):
    MD.reset()
    h = MD.convert(preprocess(body, doc_dir))
    toc = []

    def head(m):
        level, text = int(m.group(1)), m.group(2)
        plain = re.sub("<.*?>", "", text)
        hid = f"{doc_anchor}.{slug(plain)}"[:90]
        if level == 1:
            toc.append((plain, hid))
        new_level = min(level + 1, 6)
        return f'<h{new_level} id="{hid}"><a class="hlink" href="#{hid}" aria-label="Link to section">#</a>{text}</h{new_level}>'
    h = re.sub(r"<h([1-4])>(.*?)</h\1>", head, h)
    h = h.replace("<li>[ ] ", '<li class="task"><span class="box" aria-hidden="true"></span>')
    h = h.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
    h = h.replace("<pre><code", '<div class="code-wrap"><button class="copy" type="button">Copy</button><pre><code').replace("</code></pre>", "</code></pre></div>")
    return h, toc


def link_ids(h, known):
    """Turn KP-XXX-NN and ADR-NNNN mentions into links, outside code, pre, links and headings."""
    parts = re.split(r"(<[^>]+>)", h)
    depth = 0
    for k, p in enumerate(parts):
        if p.startswith("<"):
            t = re.match(r"</?(\w+)", p)
            if t and t.group(1) in ("code", "pre", "a", "svg", "figure"):
                depth += -1 if p.startswith("</") else (0 if p.endswith("/>") else 1)
            continue
        if depth > 0 or not p:
            continue
        def rep(m):
            ident = m.group(0)
            a = anchor_of(ident)
            return f'<a class="ref" href="#{a}">{ident}</a>' if a in known else ident
        parts[k] = re.sub(r"\b(?:KP-(?:GOV|PRD|PRJ|ENG|QA|SEC|OPS|LEG|FIN|HBK)-\d{2}|ADR-\d{4})\b", rep, p)
    return "".join(parts)


# ------------------------------------------------------------------------------------------------ collect
def collect():
    docs = []
    for folder, label, short in SECTIONS:
        for f in sorted(glob.glob(os.path.join(ROOT, folder, "*.md"))):
            meta, body = front_matter(open(f, encoding="utf-8").read())
            if not meta.get("id"):
                continue
            docs.append({"id": meta["id"], "title": meta.get("title", ""), "subtitle": meta.get("subtitle", ""),
                         "version": meta.get("version", ""), "owner": meta.get("owner", ""), "status": meta.get("status", ""),
                         "related": meta.get("related", ""), "banner": meta.get("banner", ""), "section": folder,
                         "sectionLabel": label, "body": body, "dir": os.path.dirname(f), "src": os.path.relpath(f, ROOT)})
    adrs = []
    for f in sorted(glob.glob(os.path.join(ROOT, "03-engineering", "adr", "*.md"))):
        txt = open(f, encoding="utf-8").read()
        m = re.match(r"# (ADR-\d{4}): (.*)", txt)
        body = re.sub(r"^# .*\n", "", txt, count=1)
        body = re.sub(r"^## ", "# ", body, flags=re.M)
        adrs.append({"id": m.group(1), "title": m.group(2), "subtitle": "Architecture decision record", "version": "",
                     "owner": "", "status": "Accepted", "related": "KP-ENG-12 Architecture Decision Log", "banner": "",
                     "section": "adr", "sectionLabel": "Decisions (ADRs)", "body": body, "dir": os.path.dirname(f),
                     "src": os.path.relpath(f, ROOT)})
    return docs, adrs


def api_reference():
    spec = yaml.safe_load(open(os.path.join(ROOT, "03-engineering", "specs", "openapi.yaml")))
    groups = {}
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            groups.setdefault(op["tags"][0], []).append((method.upper(), path, op))
    parts = ['<p class="lead">Generated from <code>03-engineering/specs/openapi.yaml</code> (OpenAPI 3.1, validated in CI). '
             'The prose reference is <a class="ref" href="#kp-eng-03">KP-ENG-03</a>; <code>tools/check_api_consistency.py</code> keeps both in sync.</p>']
    toc = []
    for tag, rows in groups.items():
        hid = f"api-reference.{slug(tag)}"
        toc.append((tag, hid))
        parts.append(f'<h2 id="{hid}"><a class="hlink" href="#{hid}">#</a>{html.escape(tag)} <span class="count">{len(rows)}</span></h2>')
        parts.append('<div class="table-wrap"><table class="api"><thead><tr><th>Method</th><th>Path</th><th>Roles</th><th>Summary</th></tr></thead><tbody>')
        for method, path, op in rows:
            flags = []
            if op.get("x-mode"): flags.append(f'<span class="flag">{op["x-mode"]} only</span>')
            if op.get("x-step-up"): flags.append('<span class="flag">step-up</span>')
            if any(p.get("$ref", "").endswith("IdempotencyKey") for p in op.get("parameters", [])): flags.append('<span class="flag">idempotency key</span>')
            parts.append(f'<tr><td><span class="verb v-{method.lower()}">{method}</span></td><td><code>{html.escape(path)}</code></td>'
                         f'<td class="roles">{", ".join(op.get("x-roles", []))}</td><td>{html.escape(op["summary"])} {"".join(flags)}</td></tr>')
        parts.append("</tbody></table></div>")
    n = sum(len(v) for v in groups.values())
    return {"id": "API reference", "anchor": "api-reference", "title": "REST API Reference", "subtitle": f"{n} operations across {len(groups)} areas",
            "section": "reference", "sectionLabel": "Reference", "html": "".join(parts), "toc": toc, "status": "Generated", "owner": "Tech Lead — Platform", "version": "1.0.0"}, n


def protocol_reference():
    spec = yaml.safe_load(open(os.path.join(ROOT, "03-engineering", "specs", "asyncapi.yaml")))
    ops = spec["operations"]; msgs = spec["components"]["messages"]
    groups = {}
    for key, ch in spec["channels"].items():
        name = ch["address"]
        groups.setdefault(name.split(":")[0], []).append((name, ops[key]["action"], msgs[key]))
    labels = {"session": "Session", "system": "System", "wallet": "Wallet", "limits": "Responsible gaming", "lobby": "Lobby",
              "table": "Table", "hand": "Hand", "turn": "Turn", "action": "Action", "street": "Street", "ff": "Fast-fold",
              "tourn": "Tournament", "spin": "Spins", "mod": "Moderation", "client": "Client telemetry"}
    parts = ['<p class="lead">Generated from <code>03-engineering/specs/asyncapi.yaml</code> (AsyncAPI 3.1). Socket.IO namespace '
             '<code>/play</code>, MessagePack encoding. Semantics: <a class="ref" href="#kp-eng-04">KP-ENG-04</a>.</p>'
             '<div class="legend"><span class="dir c2s">C→S</span> client to server, answered with an ack · '
             '<span class="dir s2c">S→C</span> server to client · <span class="flag">private</span> only the owner\'s socket</div>']
    toc = []
    n = 0
    for g, rows in groups.items():
        hid = f"protocol-reference.{slug(g)}"
        toc.append((labels.get(g, g), hid))
        parts.append(f'<h2 id="{hid}"><a class="hlink" href="#{hid}">#</a>{labels.get(g, g)} <span class="count">{len(rows)}</span></h2>')
        parts.append('<div class="table-wrap"><table class="api"><thead><tr><th>Event</th><th>Dir</th><th>Payload</th><th>Summary</th></tr></thead><tbody>')
        for name, action, msg in rows:
            n += 1
            d = '<span class="dir c2s">C→S</span>' if action == "receive" else '<span class="dir s2c">S→C</span>'
            fields = ", ".join(msg["payload"].get("properties", {}).keys()) or "—"
            ack = msg.get("x-ack-data")
            ack_s = f'<br><span class="muted">ack: {", ".join(ack) or "{}"}</span>' if ack is not None else ""
            priv = ' <span class="flag">private</span>' if msg.get("x-private") else ""
            parts.append(f'<tr><td><code>{name}</code></td><td>{d}</td><td class="fields"><code>{html.escape(fields)}</code>{ack_s}</td>'
                         f'<td>{html.escape(msg["summary"])}{priv}</td></tr>')
        parts.append("</tbody></table></div>")
    return {"id": "Protocol reference", "anchor": "protocol-reference", "title": "Real-time Protocol Reference", "subtitle": f"{n} Socket.IO events on /play",
            "section": "reference", "sectionLabel": "Reference", "html": "".join(parts), "toc": toc, "status": "Generated", "owner": "Tech Lead — Game", "version": "1.0.0"}, n


def vectors_reference():
    v = json.load(open(os.path.join(ROOT, "03-engineering", "reference", "test_vectors.json")))
    esc = html.escape
    def cards(s):
        out = []
        for c in s.split():
            suit = c[1]; red = suit in "hd"
            sym = {"s": "♠", "h": "♥", "d": "♦", "c": "♣"}[suit]
            out.append(f'<span class="card{" red" if red else ""}">{esc(c[0])}{sym}</span>')
        return "".join(out)
    parts = ['<p class="lead">Generated by <code>03-engineering/reference/poker_reference.py</code>. The TypeScript engine must reproduce every vector '
             '(CI job <code>engine-vectors</code>). Rules: <a class="ref" href="#kp-eng-06">KP-ENG-06</a>.</p>']
    toc = [("Evaluator self-check", "test-vectors.frequency"), ("Hand evaluation", "test-vectors.evaluation"), ("Showdown comparison", "test-vectors.comparison"),
           ("Betting legality", "test-vectors.betting"), ("Side pots", "test-vectors.pots"), ("Rake and distribution", "test-vectors.rake"), ("Spins paytable", "test-vectors.spin")]
    f = v.get("frequency", {})
    parts.append('<h2 id="test-vectors.frequency"><a class="hlink" href="#test-vectors.frequency">#</a>Evaluator self-check</h2>')
    parts.append('<p>All 2,598,960 five-card hands (52 cards) and all 376,992 hands of the 36-card Short Deck are enumerated on every full run. '
                 'The 52-card counts must equal the published table exactly.</p>')
    order = ["straight_flush", "four_of_a_kind", "full_house", "flush", "straight", "three_of_a_kind", "two_pair", "pair", "high_card"]
    parts.append('<div class="table-wrap"><table class="num"><thead><tr><th>Category</th><th>52 cards</th><th>36 cards (Short Deck)</th></tr></thead><tbody>')
    for c in order:
        parts.append(f'<tr><td>{c.replace("_", " ")}</td><td>{f.get("standard_52", {}).get(c, 0):,}</td><td>{f.get("shortdeck_36", {}).get(c, 0):,}</td></tr>')
    parts.append("</tbody></table></div>")
    parts.append('<h2 id="test-vectors.evaluation"><a class="hlink" href="#test-vectors.evaluation">#</a>Hand evaluation <span class="count">%d</span></h2>' % len(v["evaluation"]))
    parts.append('<div class="table-wrap"><table><thead><tr><th>Game</th><th>Hole</th><th>Board</th><th>Best five</th><th>Category</th></tr></thead><tbody>')
    for e in v["evaluation"]:
        parts.append(f'<tr><td><code>{e["game"]}</code></td><td>{cards(e["hole"])}</td><td>{cards(e["board"])}</td><td>{cards(e["best5"])}</td><td>{e["category"].replace("_", " ")}</td></tr>')
    parts.append("</tbody></table></div>")
    parts.append('<h2 id="test-vectors.comparison"><a class="hlink" href="#test-vectors.comparison">#</a>Showdown comparison <span class="count">%d</span></h2>' % len(v["comparison"]))
    parts.append('<div class="table-wrap"><table><thead><tr><th>Game</th><th>Board</th><th>Hands</th><th>Winner(s)</th><th>Why</th></tr></thead><tbody>')
    for e in v["comparison"]:
        hands = "<br>".join(f"{k}: {cards(h)}" for k, h in e["hands"].items())
        parts.append(f'<tr><td><code>{e["game"]}</code></td><td>{cards(e["board"])}</td><td>{hands}</td><td>{" & ".join(e["winners"])}</td><td>{esc(e["note"])}</td></tr>')
    parts.append("</tbody></table></div>")
    parts.append('<h2 id="test-vectors.betting"><a class="hlink" href="#test-vectors.betting">#</a>Betting legality <span class="count">%d</span></h2>' % len(v["betting"]))
    parts.append('<div class="table-wrap"><table><thead><tr><th>Case</th><th>Structure</th><th>To call</th><th>Raise range (to)</th></tr></thead><tbody>')
    for e in v["betting"]:
        L = e["legal"]; r = L.get("raise")
        rr = f'{r["min_to"]:,} – {r["max_to"]:,}' if r else "not allowed"
        parts.append(f'<tr><td>{esc(e["case"])}</td><td>{e["structure"]}</td><td class="n">{L.get("call") or ("check" if L.get("check") else "—")}</td><td class="n">{rr}</td></tr>')
    parts.append("</tbody></table></div>")
    parts.append('<h2 id="test-vectors.pots"><a class="hlink" href="#test-vectors.pots">#</a>Side pots <span class="count">%d</span></h2>' % len(v["pots"]))
    parts.append('<div class="table-wrap"><table><thead><tr><th>Case</th><th>Contributions</th><th>Returned</th><th>Pots (eligible seats)</th></tr></thead><tbody>')
    for e in v["pots"]:
        contrib = ", ".join(f"{k}: {a:,}" for k, a in e["contrib"].items())
        ret = ", ".join(f"{k}: {a:,}" for k, a in e["returned"].items()) or "—"
        pots = "<br>".join(f'{p["amount"]:,} ({", ".join(map(str, p["eligible"]))})' for p in e["pots"])
        parts.append(f'<tr><td>{esc(e["case"])}</td><td class="n">{contrib}</td><td class="n">{ret}</td><td class="n">{pots}</td></tr>')
    parts.append("</tbody></table></div>")
    parts.append('<h2 id="test-vectors.rake"><a class="hlink" href="#test-vectors.rake">#</a>Rake and distribution <span class="count">%d</span></h2>' % len(v["rake"]))
    parts.append('<div class="table-wrap"><table><thead><tr><th>Case</th><th>Rake</th><th>Per pot</th><th>Won</th></tr></thead><tbody>')
    for e in v["rake"]:
        won = ", ".join(f"seat {k}: {a:,}" for k, a in e.get("won", {}).items()) or "—"
        parts.append(f'<tr><td>{esc(e["case"])}</td><td class="n">{e["rake"]:,}</td><td class="n">{" / ".join(f"{x:,}" for x in e["rake_per_pot"])}</td><td class="n">{won}</td></tr>')
    parts.append("</tbody></table></div>")
    s = v["spin"][0]
    parts.append('<h2 id="test-vectors.spin"><a class="hlink" href="#test-vectors.spin">#</a>Spins paytable</h2>')
    parts.append(f'<p>{esc(s["case"])}. Exact return to player: <strong>{s["rtp"] * 100:.1f} %</strong> (<code>{s["rtp_exact"]}</code>).</p>')
    parts.append('<div class="table-wrap"><table class="num"><thead><tr><th>Multiplier</th><th>Per million</th><th>Probability</th><th>Prize split</th></tr></thead><tbody>')
    for r in s["paytable"]:
        parts.append(f'<tr><td>{r["multiplier"]}×</td><td>{r["per_million"]:,}</td><td>{r["per_million"] / 10000:.2f} %</td><td>{" / ".join(map(str, r["split"]))} %</td></tr>')
    parts.append("</tbody></table></div>")
    n = sum(len(v[k]) for k in ("evaluation", "comparison", "betting", "pots", "rake", "spin"))
    return {"id": "Test vectors", "anchor": "test-vectors", "title": "Engine Test Vectors", "subtitle": f"{n} normative vectors for engine-poker",
            "section": "reference", "sectionLabel": "Reference", "html": "".join(parts), "toc": toc, "status": "Generated", "owner": "Tech Lead — Game", "version": v["version"]}, n


# ------------------------------------------------------------------------------------------------ page
def status_class(s):
    s = s.lower()
    if s.startswith("approved") or s.startswith("accepted"): return "ok"
    if "counsel" in s or s.startswith("draft for") or "template" in s: return "legal"
    if s.startswith("living"): return "live"
    if s.startswith("in review"): return "review"
    if s.startswith("generated"): return "gen"
    return "draft"


def build():
    import make_playbook
    playbook = make_playbook.build()          # regenerate KP-HBK-23 from the plan data first
    docs, adrs = collect()
    pages = []
    for d in docs + adrs:
        a = anchor_of(d["id"])
        d["anchor"] = a
    known = {d["anchor"] for d in docs + adrs}
    for d in docs + adrs:
        h, toc = md_to_html(d["body"], d["dir"], d["anchor"])
        d["html"] = link_ids(h, known); d["toc"] = toc
        pages.append(d)
    api, n_api = api_reference(); proto, n_ev = protocol_reference(); vec, n_vec = vectors_reference()
    for p in (api, proto, vec):
        pages.append(p)

    # ---- navigation
    nav = ['<a class="nav-home" href="#home">Overview</a>',
           '<details class="nav-sec" open><summary>Delivery<span class="nav-n">8</span></summary><ul>']
    for a, t, n in (("kp-hbk-23", "Build with Claude", "CLDE"), ("work", "Delivery overview", "OVW"), ("work-plan", "Plan and timeline", "PLAN"), ("work-board", "Work board", "BRD"),
                    ("work-sprint", "Sprint", "SPR"), ("work-teams", "Teams and ownership", "TMS"), ("work-gates", "Gate readiness", "GTS"),
                    ("work-risks", "Risk tracker", "RSK")):
        nav.append(f'<li><a href="#{a}" data-nav="{a}"><span class="nid">{n}</span>{t}</a></li>')
    nav.append("</ul></details>")
    for folder, label, short in SECTIONS:
        items = [p for p in pages if p["section"] == folder]
        nav.append(f'<details class="nav-sec" open><summary>{label}<span class="nav-n">{len(items)}</span></summary><ul>')
        for p in items:
            nav.append(f'<li><a href="#{p["anchor"]}" data-nav="{p["anchor"]}"><span class="nid">{p["id"].split("-", 1)[1]}</span>{html.escape(p["title"])}</a></li>')
        if folder == "03-engineering":
            nav.append('<li class="nav-sub">Reference</li>')
            for p in (api, proto, vec):
                nav.append(f'<li><a href="#{p["anchor"]}" data-nav="{p["anchor"]}"><span class="nid">REF</span>{p["title"]}</a></li>')
            nav.append('<li class="nav-sub">Decisions</li>')
            for p in adrs:
                nav.append(f'<li><a href="#{p["anchor"]}" data-nav="{p["anchor"]}"><span class="nid">{p["id"][4:]}</span>{html.escape(p["title"])}</a></li>')
        nav.append("</ul></details>")

    # ---- articles
    arts = []
    for p in pages:
        pill = f'<span class="pill {status_class(p.get("status", ""))}">{html.escape(p.get("status", ""))}</span>' if p.get("status") else ""
        meta = []
        if p.get("owner"): meta.append(f'<span><b>Owner</b> {html.escape(p["owner"])}</span>')
        if p.get("version"): meta.append(f'<span><b>Version</b> {html.escape(p["version"])}</span>')
        if p.get("src"): meta.append(f'<span><b>Source</b> <code>{html.escape(p["src"])}</code></span>')
        banner = ""
        if p.get("banner"):
            b = markdown.markdown(p["banner"])
            banner = f'<div class="callout warn">{link_ids(b, known)}</div>'
        related = ""
        if p.get("related"):
            related = f'<p class="related"><b>Related</b> {link_ids(html.escape(p["related"]), known)}</p>'
        toc = "".join(f'<li><a href="#{hid}">{html.escape(t)}</a></li>' for t, hid in p.get("toc", []))
        arts.append(f'''<article class="doc" id="{p["anchor"]}" data-title="{html.escape(p["title"])}" data-docid="{html.escape(p["id"])}" data-section="{html.escape(p["sectionLabel"])}" hidden>
<header class="doc-head"><p class="crumb">{html.escape(p["sectionLabel"])}</p>
<div class="idline"><span class="docid">{html.escape(p["id"])}</span>{pill}</div>
<h1>{html.escape(p["title"])}</h1><p class="sub">{html.escape(p.get("subtitle", ""))}</p>
<div class="meta">{"".join(meta)}</div>{related}</header>{banner}
<div class="prose">{p["html"]}</div>
<nav class="toc-data" hidden><ul>{toc}</ul></nav></article>''')

    # ---- register table for overview
    rows = []
    for p in docs:
        rows.append(f'<tr data-sec="{p["section"]}"><td><a class="ref" href="#{p["anchor"]}">{p["id"]}</a></td><td>{html.escape(p["title"])}</td>'
                    f'<td>{html.escape(p["owner"])}</td><td><span class="pill {status_class(p["status"])}">{html.escape(p["status"].split(" — ")[0])}</span></td></tr>')
    sec_opts = "".join(f'<option value="{f}">{l}</option>' for f, l, _ in SECTIONS)
    stats = [(len(docs), "documents"), (len(adrs), "decisions"), (n_api, "API operations"), (n_ev, "real-time events"), (n_vec, "engine vectors")]
    stat_html = "".join(f'<div class="stat"><span class="stat-n">{n}</span><span class="stat-l">{l}</span></div>' for n, l in stats)
    sdlc = mermaid_svg("""flowchart LR
  A[Idea] --> B[Discovery]
  B --> C{Risk class}
  C -- standard --> D[Story ready]
  C -- critical --> R[RFC + ADR]
  R --> D
  D --> E[Build + tests]
  E --> F[Review + CI]
  F --> G[Staging + QA]
  G --> H[Canary Play]
  H --> I[Canary Real]
  I --> J[Operate]""")

    paths = [
        ("I'm building with Claude", "The ordered path to Beta: what to type, what Claude builds, what you check.", "kp-hbk-23", ["KP-HBK-23", "KP-HBK-06", "KP-OPS-06"]),
        ("I'm tracking delivery", "Milestones, the work board, sprints, teams, gates and risks — live.", "work", ["KP-HBK-06", "KP-OPS-06", "KP-PRJ-03"]),
        ("I just joined", "Start here, set up your laptop and play a hand against bots.", "kp-hbk-01", ["KP-HBK-01", "KP-HBK-02", "KP-HBK-21"]),
        ("I'm planning work", "Milestones, work packages and how a quarter and a sprint run.", "kp-hbk-06", ["KP-HBK-06", "KP-HBK-05", "KP-PRD-03"]),
        ("I'm building the game", "Engine rules, vectors, tables, tournaments and the RNG.", "kp-hbk-11", ["KP-HBK-11", "KP-ENG-06", "KP-ENG-07"]),
        ("I'm touching money", "Ledger, postings, payments, treasury and reconciliation.", "kp-hbk-12", ["KP-HBK-12", "KP-ENG-08", "KP-FIN-02"]),
        ("I'm shipping", "CI/CD, release train, flags, observability and on-call.", "kp-hbk-15", ["KP-HBK-15", "KP-HBK-16", "KP-HBK-19"]),
    ]
    path_html = ""
    for i, (t, s, a, refs) in enumerate(paths, 1):
        refs_h = " · ".join(f'<a class="ref" href="#{anchor_of(r)}">{r}</a>' for r in refs)
        path_html += f'<div class="path"><a class="path-t" href="#{a}">{t}</a><p>{s}</p><p class="path-r">{refs_h}</p></div>'

    home = f'''<section class="home" id="home">
<div class="hero"><div class="hero-mark">{LOGO_SVG}</div>
<div><p class="eyebrow">Kilima Poker · Engineering</p>
<h1>Build it right. Ship it every Tuesday.</h1>
<p class="lead">Everything the team needs to build Kilima Poker: the full project dossier, the engineering handbook with our development processes, every architecture decision, and references generated straight from the API specs and the engine's reference implementation.</p>
<button class="search-cta" type="button" data-open-search><span>Search {len(pages)} pages</span><kbd>Ctrl K</kbd></button></div></div>
<div class="stats">{stat_html}</div>
<h2 class="h-sec">Pick your path</h2><div class="paths">{path_html}</div>
<h2 class="h-sec">How work flows</h2>
<div class="flow-card">{sdlc}<p class="muted">Risk classes and approvals: <a class="ref" href="#kp-hbk-03">KP-HBK-03</a> · release train: <a class="ref" href="#kp-hbk-15">KP-HBK-15</a></p></div>
<h2 class="h-sec">Document register</h2>
<div class="reg-bar"><label for="regsec">Section</label><select id="regsec"><option value="">All sections</option>{sec_opts}</select>
<label for="regq" class="sr">Filter</label><input id="regq" type="search" placeholder="Filter by title or owner" autocomplete="off"></div>
<div class="table-wrap"><table class="register"><thead><tr><th>ID</th><th>Document</th><th>Owner</th><th>Status</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div>
<p class="foot muted">Generated from the <code>kilima-poker-docs</code> repository by <code>tools/build_site.py</code>. Legal and finance documents are drafts for counsel and finance review.</p>
</section>'''

    import work_seed
    baseline = work_seed.build()
    pb, order = {}, 0
    for si, st in enumerate(playbook["stages"]):
        for step in st["steps"]:
            order += 1
            if not step["id"].startswith("WP-"):
                continue
            pb[step["id"]] = {"stage": st["id"], "stageIdx": si, "stageTitle": st["title"], "order": order, "who": step["who"],
                              "read": step.get("read", []), "youVerify": step.get("you_verify", ""),
                              "slices": [{k: sl[k] for k in ("n", "title", "goal", "done", "prompt", "short")} for sl in step["slices"]]}
    baseline["playbook"] = pb
    work = open(os.path.join(ROOT, "tools", "site_work.html"), encoding="utf-8").read()
    work = work.replace("{{BASELINE}}", json.dumps(baseline).replace("</", "<\\/"))
    body = TEMPLATE.replace("{{WORK}}", work).replace("{{NAV}}", "".join(nav)).replace("{{HOME}}", home).replace("{{ARTICLES}}", "\n".join(arts))
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(body)
    open(os.path.join(OUT, "preview.html"), "w", encoding="utf-8").write(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'
        + body + "</body></html>")
    print(f"site/index.html: {len(pages)} pages, {len(body) / 1e6:.2f} MB")


LOGO_SVG = '''<svg viewBox="0 0 170 150" aria-hidden="true"><path d="M15 130 L85 20 L155 130 Z" fill="#3A6FD8"/><path d="M85 20 L62 56 L74 50 L85 62 L96 50 L108 56 Z" fill="#fff"/><path d="M58 104 L112 104 L106 94 L64 94 Z" fill="#10213D"/><circle cx="136" cy="34" r="16" fill="#FFD166"/><circle cx="136" cy="34" r="10" fill="none" stroke="#10213D" stroke-width="3" stroke-dasharray="4 4"/></svg>'''

TEMPLATE = open(os.path.join(ROOT, "tools", "site_template.html"), encoding="utf-8").read().replace("{{LOGO}}", LOGO_SVG)

if __name__ == "__main__":
    build()
