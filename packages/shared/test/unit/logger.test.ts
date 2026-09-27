import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger, REDACT_CENSOR } from "../../src/logger.js";

function capture() {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
      cb();
    },
  });
  return { lines, destination };
}

describe("createLogger", () => {
  it("writes structured JSON with service, mode and level label", () => {
    const { lines, destination } = capture();
    createLogger({ service: "sample", mode: "play", destination }).info({ tableId: "t1" }, "hello");
    expect(lines[0]).toMatchObject({
      service: "sample",
      mode: "play",
      level: "info",
      tableId: "t1",
      msg: "hello",
    });
    expect(typeof lines[0]!.time).toBe("string");
  });

  it("redacts secrets, personal data and cards at top level and nested", () => {
    const { lines, destination } = capture();
    createLogger({ service: "s", destination }).info({
      password: "p",
      otp: "123456",
      phone: "+254700000000",
      holeCards: ["As", "Kd"],
      user: { refreshToken: "r", msisdn: "+2547" },
      hand: { seat: { cards: ["2c", "3c"] } },
      req: { headers: { authorization: "Bearer x", cookie: "sid=1" } },
      body: { code: "654321" },
    });
    const line = JSON.stringify(lines[0]);
    for (const secret of [
      "123456",
      "+254700000000",
      "As",
      "Bearer x",
      "sid=1",
      "654321",
      '"r"',
      "+2547",
      "2c",
    ]) {
      expect(line).not.toContain(secret);
    }
    expect(lines[0]!.password).toBe(REDACT_CENSOR);
    expect((lines[0]!.user as Record<string, unknown>).refreshToken).toBe(REDACT_CENSOR);
  });

  it("keeps error codes visible", () => {
    const { lines, destination } = capture();
    createLogger({ service: "s", destination }).error({ err: { code: "TABLE_FULL" } }, "failed");
    expect((lines[0]!.err as Record<string, unknown>).code).toBe("TABLE_FULL");
  });

  it("respects the level", () => {
    const { lines, destination } = capture();
    const log = createLogger({ service: "s", level: "warn", destination });
    log.info("hidden");
    log.warn("shown");
    expect(lines.map((l) => l.msg)).toEqual(["shown"]);
  });
});
