"""Tiny markdown-ish -> styled PDF renderer for the Kilima Poker project dossier."""
import re, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, Preformatted, PageBreak, KeepTogether,
                                CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("Sans", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-B", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Sans-I", F + "DejaVuSans-Oblique.ttf"))
pdfmetrics.registerFont(TTFont("Sans-BI", F + "DejaVuSans-BoldOblique.ttf"))
pdfmetrics.registerFont(TTFont("Mono", F + "DejaVuSansMono.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Sans", normal="Sans", bold="Sans-B", italic="Sans-I", boldItalic="Sans-BI")

INK = colors.HexColor("#1b1f24")
MUTED = colors.HexColor("#5b6470")
ACCENT = colors.HexColor("#10213d")   # Kilima navy
BLUE = colors.HexColor("#3a6fd8")
GOLD = colors.HexColor("#ffd166")
ACCENT_L = colors.HexColor("#eaf0fb")
RULE = colors.HexColor("#d5dbe1")
CODE_BG = colors.HexColor("#f4f6f8")
WARN_BG = colors.HexColor("#fff6e0")
WARN_BORDER = colors.HexColor("#d99a00")

S = {
    "body": ParagraphStyle("body", fontName="Sans", fontSize=9.4, leading=13.6, textColor=INK, spaceAfter=5),
    "h1": ParagraphStyle("h1", fontName="Sans-B", fontSize=15, leading=19, textColor=ACCENT, spaceBefore=14, spaceAfter=7),
    "h2": ParagraphStyle("h2", fontName="Sans-B", fontSize=11.2, leading=15, textColor=INK, spaceBefore=10, spaceAfter=4),
    "h3": ParagraphStyle("h3", fontName="Sans-B", fontSize=9.6, leading=13, textColor=MUTED, spaceBefore=7, spaceAfter=3),
    "bullet": ParagraphStyle("bullet", fontName="Sans", fontSize=9.4, leading=13.4, textColor=INK,
                             leftIndent=13, bulletIndent=3, spaceAfter=2.5, bulletFontName="Sans"),
    "bullet2": ParagraphStyle("bullet2", fontName="Sans", fontSize=9.0, leading=12.8, textColor=INK,
                              leftIndent=26, bulletIndent=16, spaceAfter=2, bulletFontName="Sans"),
    "code": ParagraphStyle("code", fontName="Mono", fontSize=7.7, leading=10.2, textColor=INK),
    "cell": ParagraphStyle("cell", fontName="Sans", fontSize=8.2, leading=11, textColor=INK),
    "cellh": ParagraphStyle("cellh", fontName="Sans-B", fontSize=8.2, leading=11, textColor=colors.white),
    "note": ParagraphStyle("note", fontName="Sans", fontSize=9, leading=13, textColor=INK),
    "toc1": ParagraphStyle("toc1", fontName="Sans", fontSize=9.6, leading=15, textColor=INK, leftIndent=4),
}


KICKER = {"KP-GOV": "GOVERNANCE", "KP-PRD": "PRODUCT", "KP-PRJ": "PROJECT MANAGEMENT",
          "KP-ENG": "ENGINEERING", "KP-QA": "QUALITY", "KP-SEC": "SECURITY", "KP-OPS": "OPERATIONS",
          "KP-LEG": "LEGAL AND COMPLIANCE", "KP-FIN": "FINANCE AND TREASURY",
          "KP-HBK": "ENGINEERING HANDBOOK"}


def draw_logo(c, x, y, size):
    """Kilima mark: mountain forming an 'A' with a poker-chip sun. (x, y) = bottom-left."""
    s = size / 170.0
    def P(px, py):
        return x + px * s, y + (150 - py) * s
    c.saveState()
    def poly(pts, fill):
        path = c.beginPath(); path.moveTo(*P(*pts[0]))
        for q in pts[1:]:
            path.lineTo(*P(*q))
        path.close(); c.setFillColor(fill); c.drawPath(path, stroke=0, fill=1)
    poly([(15, 130), (85, 20), (155, 130)], BLUE)
    poly([(85, 20), (62, 56), (74, 50), (85, 62), (96, 50), (108, 56)], colors.white)
    poly([(58, 104), (112, 104), (106, 94), (64, 94)], ACCENT)
    cx, cy = P(136, 34)
    c.setFillColor(GOLD); c.circle(cx, cy, 16 * s, stroke=0, fill=1)
    c.setStrokeColor(ACCENT); c.setLineWidth(3 * s); c.setDash(4 * s, 4 * s)
    c.circle(cx, cy, 10 * s, stroke=1, fill=0)
    c.restoreState()


def inline(t):
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    codes = []
    def keep(m):
        codes.append('<font name="Mono" size="8.3" color="#8a1c3a">' + m.group(1) + "</font>")
        return "\x00%d\x00" % (len(codes) - 1)
    t = re.sub(r"`([^`]+)`", keep, t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: codes[int(m.group(1))], t)


class Doc(BaseDocTemplate):
    def __init__(self, fn, title, subtitle, version, prefix=None, **kw):
        super().__init__(fn, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                         topMargin=20 * mm, bottomMargin=18 * mm, title=title,
                         author="Kilima Poker", subject=subtitle, **kw)
        self.doc_title, self.subtitle, self.version = title, subtitle, version
        self.prefix = prefix
        fr = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="f")
        self.addPageTemplates([PageTemplate("cover", [fr], onPage=self.cover),
                               PageTemplate("body", [fr], onPage=self.chrome)])

    def cover(self, c, d):
        w, h = A4
        c.saveState()
        c.setFillColor(ACCENT); c.rect(0, h - 95 * mm, w, 95 * mm, stroke=0, fill=1)
        c.setFillColor(BLUE); c.rect(0, h - 95 * mm, w, 1.6 * mm, stroke=0, fill=1)
        draw_logo(c, 20 * mm, h - 34 * mm, 13 * mm)
        c.setFillColor(colors.white)
        c.setFont("Sans-B", 11); c.drawString(36 * mm, h - 27.5 * mm, "KILIMA POKER")
        c.setFont("Sans", 8.2); c.setFillColor(colors.HexColor("#bcd0ff"))
        c.drawString(36 * mm, h - 32.5 * mm, KICKER.get(self.prefix, "PROJECT DOSSIER"))
        c.setFillColor(colors.white)
        c.setFont("Sans-B", 25 if len(self.doc_title) < 30 else 20); c.drawString(20 * mm, h - 55 * mm, self.doc_title)
        c.setFont("Sans", 12.5 if len(self.subtitle) < 70 else 10.5); c.setFillColor(colors.HexColor("#d6e2ff"))
        c.drawString(20 * mm, h - 66 * mm, self.subtitle)
        c.setFont("Sans", 9.5); c.setFillColor(colors.HexColor("#cfd8ea")); c.drawString(20 * mm, h - 82 * mm, self.version)
        c.restoreState()

    def chrome(self, c, d):
        w, h = A4
        c.saveState()
        c.setStrokeColor(RULE); c.setLineWidth(0.6)
        c.line(20 * mm, h - 13 * mm, w - 20 * mm, h - 13 * mm)
        c.setFont("Sans", 7.6); c.setFillColor(MUTED)
        c.drawString(20 * mm, h - 11 * mm, "Kilima Poker — " + self.doc_title)
        c.drawRightString(w - 20 * mm, h - 11 * mm, self.version)
        c.drawString(20 * mm, 10 * mm, "Internal — Confidential")
        c.drawRightString(w - 20 * mm, 10 * mm, "Page %d" % d.page)
        c.restoreState()

    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and f.style.name == "h1":
            key = "h%d" % id(f)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(f.getPlainText(), key, 0)
            self.notify("TOCEntry", (0, f.getPlainText(), self.page, key))


def table(rows, widths=None):
    head, body = rows[0], rows[1:]
    data = [[Paragraph(inline(c), S["cellh"]) for c in head]] + \
           [[Paragraph(inline(c), S["cell"]) for c in r] for r in body]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    st = [("BACKGROUND", (0, 0), (-1, 0), ACCENT),
          ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("GRID", (0, 0), (-1, -1), 0.4, RULE),
          ("LEFTPADDING", (0, 0), (-1, -1), 4.5), ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
          ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]
    for i in range(1, len(data)):
        if i % 2 == 0:
            st.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f7f9fa")))
    t.setStyle(TableStyle(st))
    return t


def boxed(flow, bg, border):
    t = Table([[flow]], colWidths=["100%"])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.5, border),
                           ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


CODE_MAX = 100


def wrap_code(lines, width=CODE_MAX):
    """Soft-wrap long code lines at spaces so nothing is cut off; continuation lines are indented."""
    out = []
    for ln in lines:
        indent = len(ln) - len(ln.lstrip(" "))
        cont = " " * min(indent + 4, 40)
        while len(ln) > width:
            cut = ln.rfind(" ", indent + 10, width)
            if cut <= indent + 10:
                cut = width
            out.append(ln[:cut].rstrip())
            ln = cont + ln[cut:].lstrip()
        out.append(ln)
    return out


def parse(src, extra=None):
    story, lines, i = [], src.split("\n"), 0
    extra = extra or {}
    def col_widths(n, spec):
        total = 170 * mm
        if spec:
            parts = [float(x) for x in spec.split(",")]
            s = sum(parts)
            return [total * p / s for p in parts]
        return [total / n] * n
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("```"):
            j = i + 1; buf = []
            while not lines[j].startswith("```"):
                buf.append(lines[j]); j += 1
            wrapped = wrap_code(buf)
            for k in range(0, max(len(wrapped), 1), 60):   # long blocks are split so each part fits a page
                pre = Preformatted("\n".join(wrapped[k:k + 60]), S["code"])
                t = Table([[pre]], colWidths=["100%"])
                t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                                       ("BOX", (0, 0), (-1, -1), 0.4, RULE),
                                       ("LEFTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5),
                                       ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
                story += [t, Spacer(1, 6)]
            i = j + 1; continue
        if ln.startswith("@widths "):
            pending_w = ln[8:].strip(); i += 1
            extra["_w"] = pending_w; continue
        if ln.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                raw = lines[i].strip()[1:-1]
                cells = [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", raw)]
                if not all(re.fullmatch(r":?-+:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            spec = extra.pop("_w", None)
            if spec and len(spec.split(",")) != len(rows[0]):
                print("WARNING: @widths has %d values for %d columns: %s" % (len(spec.split(",")), len(rows[0]), rows[0]))
                spec = None
            story += [table(rows, col_widths(len(rows[0]), spec)), Spacer(1, 7)]
            continue
        if ln.startswith("> ") or ln.startswith("!> "):
            warn = ln.startswith("!")
            buf = []
            while i < len(lines) and (lines[i].startswith("> ") or lines[i].startswith("!> ")):
                buf.append(lines[i].split("> ", 1)[1]); i += 1
            story += [boxed(Paragraph(inline(" ".join(buf)), S["note"]),
                            WARN_BG if warn else ACCENT_L, WARN_BORDER if warn else ACCENT), Spacer(1, 7)]
            continue
        if ln.startswith("@include "):
            import glob as _g, os as _o
            d = _o.path.join(extra.get("_dir", "."), ln[9:].strip())
            for fp in sorted(_g.glob(_o.path.join(d, "*.md"))):
                story += parse(open(fp, encoding="utf-8").read(), extra)
            i += 1; continue
        if ln.startswith("@diagram "):
            story += [extra[ln[9:].strip()](), Spacer(1, 8)]; i += 1; continue
        if ln.strip() == "@pagebreak":
            story.append(PageBreak()); i += 1; continue
        if ln.startswith("# "):
            story += [CondPageBreak(40 * mm), Paragraph(inline(ln[2:]), S["h1"])]; i += 1; continue
        if ln.startswith("## "):
            story += [CondPageBreak(25 * mm), Paragraph(inline(ln[3:]), S["h2"])]; i += 1; continue
        if ln.startswith("### "):
            story.append(Paragraph(inline(ln[4:]), S["h3"])); i += 1; continue
        if ln.startswith("  - "):
            story.append(Paragraph(inline(ln[4:]), S["bullet2"], bulletText="–")); i += 1; continue
        if ln.startswith("- [ ] "):
            story.append(Paragraph(inline(ln[6:]), S["bullet"], bulletText="\u2610")); i += 1; continue
        if ln.startswith("- "):
            story.append(Paragraph(inline(ln[2:]), S["bullet"], bulletText="•")); i += 1; continue
        m = re.match(r"(\d+)\. (.*)", ln)
        if m:
            story.append(Paragraph(inline(m.group(2)), S["bullet"], bulletText=m.group(1) + ".")); i += 1; continue
        if not ln.strip():
            i += 1; continue
        buf = [ln]; i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"(#|- |  - |\||```|> |!> |@|\d+\. )", lines[i]):
            buf.append(lines[i]); i += 1
        story.append(Paragraph(inline(" ".join(buf)), S["body"]))
    return story


def front_matter(src):
    meta = {}
    if src.startswith("---\n"):
        head, src = src[4:].split("\n---\n", 1)
        for ln in head.splitlines():
            if ":" in ln:
                k, v = ln.split(":", 1); meta[k.strip()] = v.strip()
    return meta, src


def control_block(meta):
    rows = [["Field", "Value"], ["Document ID", meta.get("id", "")], ["Version", meta.get("version", "1.0")],
            ["Date", meta.get("date", "September 2026")], ["Owner", meta.get("owner", "")],
            ["Status", meta.get("status", "Draft")]]
    if meta.get("related"):
        rows.append(["Related", meta["related"]])
    w = 170 * mm
    return [table(rows, [w * .25, w * .75]), Spacer(1, 8)]


def build_file(src_path, out_path, extra=None):
    meta, src = front_matter(open(src_path, encoding="utf-8").read())
    v = "Version %s — %s" % (meta.get("version", "1.0"), meta.get("date", "September 2026"))
    title = meta.get("title", "Untitled")
    if meta.get("id"):
        v = meta["id"] + "  ·  " + v
    prefix = "-".join(meta.get("id", "").split("-")[:2])
    doc = Doc(out_path, title, meta.get("subtitle", ""), v, prefix=prefix)
    from reportlab.platypus.doctemplate import NextPageTemplate
    toc = TableOfContents(); toc.levelStyles = [S["toc1"]]; toc.dotsMinLevel = 0
    story = [Spacer(1, 88 * mm), Paragraph("Contents", S["h2"]), toc, NextPageTemplate("body"), PageBreak()]
    if meta.get("banner"):
        story += [boxed(Paragraph(inline(meta["banner"]), S["note"]), WARN_BG, WARN_BORDER), Spacer(1, 8)]
    if meta.get("control") != "manual":
        story += control_block(meta)
    extra = dict(extra or {}); extra["_dir"] = __import__("os").path.dirname(src_path)
    story += parse(src, extra)
    doc.multiBuild(story)
    return meta


def build(src_path, out_path, title, subtitle, version, extra=None):
    src = open(src_path, encoding="utf-8").read()
    doc = Doc(out_path, title, subtitle, version)
    from reportlab.platypus.doctemplate import NextPageTemplate
    toc = TableOfContents(); toc.levelStyles = [S["toc1"]]; toc.dotsMinLevel = 0
    story = [Spacer(1, 88 * mm), Paragraph("Contents", S["h2"]), toc,
             NextPageTemplate("body"), PageBreak()]
    story += parse(src, extra)
    doc.multiBuild(story)
