import type { Logger } from "@kilima/shared/logger";
import type { Readiness } from "./domain/readiness.js";

export interface ShutdownDeps {
  logger: Logger;
  readiness: Readiness;
  timeoutMs: number;
  /** Closed in order: servers first (finish in-flight requests), then pools. */
  closers: (() => Promise<unknown>)[];
  exit?: (code: number) => void;
}

/**
 * Graceful shutdown (KP-HBK-07 §3): SIGTERM → readiness false → finish in-flight work
 * (bounded by timeoutMs) → close resources → exit.
 */
export async function shutdown(deps: ShutdownDeps, signal: string): Promise<number> {
  const { logger, readiness, timeoutMs, closers } = deps;
  if (readiness.draining) return 0;
  readiness.startDraining();
  logger.info({ signal }, "draining");

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => {
      resolve("timeout");
    }, timeoutMs);
  });
  const closeAll = (async () => {
    for (const close of closers) await close();
    return "closed" as const;
  })();

  try {
    const outcome = await Promise.race([closeAll, timeout]);
    if (outcome === "timeout") {
      logger.error({ timeoutMs }, "shutdown timed out");
      return 1;
    }
    logger.info("shutdown complete");
    return 0;
  } catch (err) {
    logger.error({ err }, "shutdown failed");
    return 1;
  } finally {
    clearTimeout(timer);
  }
}

export function installShutdown(deps: ShutdownDeps): void {
  const exit = deps.exit ?? ((code: number) => process.exit(code));
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void shutdown(deps, signal).then(exit);
    });
  }
}
