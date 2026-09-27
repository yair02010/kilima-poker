from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.lib import colors
from reportlab.lib.units import mm

ACC = colors.HexColor("#10213d"); ACC_L = colors.HexColor("#eaf0fb")
INK = colors.HexColor("#1b1f24"); MUT = colors.HexColor("#5b6470"); RULE = colors.HexColor("#9aa5b1")
STORE = colors.HexColor("#eef1f5")


def box(d, x, y, w, h, title, sub=None, fill=ACC_L, stroke=ACC, fs=8.2):
    d.add(Rect(x, y, w, h, rx=4, ry=4, fillColor=fill, strokeColor=stroke, strokeWidth=0.8))
    d.add(String(x + w / 2, y + h / 2 + (3 if sub else -3), title, fontName="Sans-B", fontSize=fs,
                 fillColor=INK, textAnchor="middle"))
    if sub:
        d.add(String(x + w / 2, y + h / 2 - 8, sub, fontName="Sans", fontSize=6.6, fillColor=MUT,
                     textAnchor="middle"))


def arrow(d, x1, y1, x2, y2, label=None, dashed=False):
    ln = Line(x1, y1, x2, y2, strokeColor=RULE, strokeWidth=0.9)
    if dashed:
        ln.strokeDashArray = [3, 2]
    d.add(ln)
    import math
    a = math.atan2(y2 - y1, x2 - x1); s = 4
    d.add(Polygon([x2, y2, x2 - s * math.cos(a - .4), y2 - s * math.sin(a - .4),
                   x2 - s * math.cos(a + .4), y2 - s * math.sin(a + .4)], fillColor=RULE, strokeColor=RULE))
    if label:
        d.add(String((x1 + x2) / 2 + 3, (y1 + y2) / 2 + 2, label, fontName="Sans", fontSize=6.3, fillColor=MUT))


def arch():
    W, H = 170 * mm, 300
    d = Drawing(W, H)
    cx = W / 2
    # clients
    cw = 120
    for i, (t, sub) in enumerate([("Android app", "React Native"), ("Web app (PWA)", "React"), ("Operator skins", "B2B brands")]):
        box(d, 10 + i * (cw + 21), H - 26, cw, 22, t, sub)
    # edge
    box(d, 10, H - 60, W - 20, 20, "Edge — CDN · WAF · DDoS · TLS · African PoPs", fill=colors.white)
    for i in range(3):
        arrow(d, 10 + i * (cw + 21) + cw / 2, H - 26, 10 + i * (cw + 21) + cw / 2, H - 40)
    # entry tier
    box(d, 30, H - 96, 190, 22, "gateway", "WSS /play · Socket.IO · MessagePack", fill=colors.white)
    box(d, W - 220, H - 96, 190, 22, "API ingress", "REST /api/v1 · Operator API", fill=colors.white)
    arrow(d, 125, H - 60, 125, H - 74)
    arrow(d, W - 125, H - 60, W - 125, H - 74)
    # game tier
    gy = H - 138
    gw = 108
    game = [("table-server", "table actors · engines"), ("lobby", "tables · SNG · Spins"),
            ("tournament", "MTT director"), ("rng", "certified DRBG")]
    for i, (t, sub) in enumerate(game):
        box(d, 10 + i * (gw + 9), gy, gw, 26, t, sub)
    arrow(d, 90, H - 96, 64, gy + 26)
    arrow(d, W - 125, H - 96, 181, gy + 26)
    # platform tier
    py = H - 182
    pw = 53
    plat = [("identity", "auth"), ("player", "profiles"), ("wallet", "ledger"), ("cashier", "payments"),
            ("compliance", "KYC · AML"), ("integrity", "anti-cheat"), ("operator", "B2B"), ("backoffice", "staff")]
    for i, (t, sub) in enumerate(plat):
        box(d, 10 + i * (pw + 4.3), py, pw, 28, t, sub, fill=colors.white, fs=7.2)
    arrow(d, W - 125, H - 96, W - 125, py + 28)
    # bus
    by = py - 26
    d.add(Rect(10, by, W - 20, 16, rx=3, ry=3, fillColor=colors.HexColor("#fff6e0"),
               strokeColor=colors.HexColor("#d99a00"), strokeWidth=0.6))
    d.add(String(W / 2, by + 5, "Kafka — hand.completed · wallet.tx.posted · payment.status · tournament.lifecycle · integrity.action",
                 fontName="Sans", fontSize=6.6, fillColor=INK, textAnchor="middle"))
    for i in range(8):
        x = 10 + i * (pw + 4.3) + pw / 2
        arrow(d, x, py, x, by + 16, dashed=True)
    # stores
    sy = by - 50
    sw = 86
    stores = [("PostgreSQL core", "identity · player · lobby"), ("PostgreSQL ledger", "wallet · cashier"),
              ("Redis Cluster", "live tables · queues"), ("ClickHouse", "hand histories · ML"),
              ("Object storage", "WORM archives")]
    for i, (t, sub) in enumerate(stores):
        box(d, 10 + i * (sw + 7.5), sy, sw, 34, t, sub, fill=STORE, stroke=RULE)
        arrow(d, 10 + i * (sw + 7.5) + sw / 2, by, 10 + i * (sw + 7.5) + sw / 2, sy + 34)
    # external
    ey = 6
    box(d, 10, ey, W - 20, 26, "External — mobile money & PSPs · KYC/AML · SMS/WhatsApp · geolocation · regulators · test lab",
        fill=STORE, stroke=RULE)
    return d
