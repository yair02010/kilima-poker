import { afterEach, describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

let ctx: ReturnType<typeof setup> | undefined;
afterEach(async () => {
  await ctx?.app.close();
  await ctx?.internal.close();
  ctx = undefined;
});

describe("sample service endpoints (KP-HBK-07 §3)", () => {
  it("/healthz answers 200 without checking dependencies", async () => {
    ctx = setup([{ name: "db", check: () => Promise.resolve(false) }]);
    const res = await ctx.app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("/readyz answers 200 when every dependency is up", async () => {
    ctx = setup([{ name: "db", check: () => Promise.resolve(true) }]);
    const res = await ctx.app.inject({ method: "GET", url: "/readyz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ready: true, draining: false, checks: { db: "ok" } });
  });

  it("/readyz answers 503 when a dependency is down or throws", async () => {
    ctx = setup([
      { name: "db", check: () => Promise.resolve(true) },
      { name: "redis", check: () => Promise.reject(new Error("down")) },
    ]);
    const res = await ctx.app.inject({ method: "GET", url: "/readyz" });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ ready: false, checks: { db: "ok", redis: "failed" } });
  });

  it("/readyz answers 503 while draining", async () => {
    ctx = setup();
    ctx.readiness.startDraining();
    const res = await ctx.app.inject({ method: "GET", url: "/readyz" });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ ready: false, draining: true });
  });

  it("/version reports version, commit, build time and mode", async () => {
    ctx = setup();
    const res = await ctx.app.inject({ method: "GET", url: "/version" });
    expect(res.json()).toEqual({
      service: "sample",
      version: "1.2.3",
      commit: "abc1234",
      buildTime: "2026-09-27T00:00:00Z",
      mode: "play",
    });
  });

  it("/metrics is served on the internal server only, with RED metrics", async () => {
    ctx = setup();
    await ctx.app.inject({ method: "GET", url: "/healthz" });
    const pub = await ctx.app.inject({ method: "GET", url: "/metrics" });
    expect(pub.statusCode).toBe(404);
    const res = await ctx.internal.inject({ method: "GET", url: "/metrics" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.body).toMatch(/http_requests_total\{[^}]*route="\/healthz"[^}]*status="200"[^}]*\} 1/);
    expect(res.body).toContain("process_cpu_user_seconds_total");
  });

  it("returns the standard error body with a request id for unknown routes", async () => {
    ctx = setup();
    const res = await ctx.app.inject({ method: "GET", url: "/nope" });
    expect(res.statusCode).toBe(404);
    const body = res.json<{ error: { code: string; requestId: string } }>();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.requestId).toBe(res.headers["x-request-id"]);
  });

  it("propagates an incoming x-request-id", async () => {
    ctx = setup();
    const res = await ctx.app.inject({ method: "GET", url: "/healthz", headers: { "x-request-id": "abc" } });
    expect(res.headers["x-request-id"]).toBe("abc");
  });

  it("hides internal error details behind a 500", async () => {
    ctx = setup();
    ctx.app.get("/boom", () => {
      throw new Error("db password leaked");
    });
    const res = await ctx.app.inject({ method: "GET", url: "/boom" });
    expect(res.statusCode).toBe(500);
    expect(res.body).not.toContain("password");
    expect(res.json()).toMatchObject({ error: { code: "INTERNAL" } });
  });
});
