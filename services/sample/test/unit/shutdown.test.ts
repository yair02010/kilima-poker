import { describe, expect, it } from "vitest";
import { Readiness } from "../../src/domain/readiness.js";
import { shutdown } from "../../src/shutdown.js";
import { silentLogger } from "./helpers.js";

describe("graceful shutdown", () => {
  it("drains first, then closes resources in order", async () => {
    const readiness = new Readiness();
    const order: string[] = [];
    const code = await shutdown(
      {
        logger: silentLogger(),
        readiness,
        timeoutMs: 1000,
        closers: [
          () => {
            order.push(readiness.draining ? "server(draining)" : "server");
            return Promise.resolve();
          },
          () => {
            order.push("pool");
            return Promise.resolve();
          },
        ],
      },
      "SIGTERM",
    );
    expect(code).toBe(0);
    expect(order).toEqual(["server(draining)", "pool"]);
    expect((await readiness.report()).ready).toBe(false);
  });

  it("gives up after the timeout with a non-zero exit code", async () => {
    const code = await shutdown(
      {
        logger: silentLogger(),
        readiness: new Readiness(),
        timeoutMs: 20,
        closers: [() => new Promise(() => undefined)],
      },
      "SIGTERM",
    );
    expect(code).toBe(1);
  });

  it("reports failure when a closer throws", async () => {
    const code = await shutdown(
      {
        logger: silentLogger(),
        readiness: new Readiness(),
        timeoutMs: 1000,
        closers: [() => Promise.reject(new Error("x"))],
      },
      "SIGTERM",
    );
    expect(code).toBe(1);
  });

  it("is idempotent when a second signal arrives", async () => {
    const readiness = new Readiness();
    readiness.startDraining();
    let closed = 0;
    const code = await shutdown(
      {
        logger: silentLogger(),
        readiness,
        timeoutMs: 1000,
        closers: [
          () => {
            closed++;
            return Promise.resolve();
          },
        ],
      },
      "SIGINT",
    );
    expect(code).toBe(0);
    expect(closed).toBe(0);
  });
});
