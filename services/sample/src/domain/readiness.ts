/**
 * Readiness state of a service instance. Pure domain logic: no framework imports (KP-HBK-07 §2).
 * /readyz is true only when the instance is not draining and every dependency check passes.
 */

export interface DependencyCheck {
  name: string;
  check: () => Promise<boolean>;
}

export interface ReadinessReport {
  ready: boolean;
  draining: boolean;
  checks: Record<string, "ok" | "failed">;
}

export class Readiness {
  #draining = false;
  readonly #checks: DependencyCheck[];

  constructor(checks: DependencyCheck[] = []) {
    this.#checks = [...checks];
  }

  get draining(): boolean {
    return this.#draining;
  }

  /** Called on SIGTERM: from now on /readyz answers 503 so the load balancer stops routing here. */
  startDraining(): void {
    this.#draining = true;
  }

  async report(): Promise<ReadinessReport> {
    const results = await Promise.all(
      this.#checks.map(async (c) => {
        try {
          return [c.name, (await c.check()) ? "ok" : "failed"] as const;
        } catch {
          return [c.name, "failed"] as const;
        }
      }),
    );
    const checks = Object.fromEntries(results);
    const ready = !this.#draining && results.every(([, r]) => r === "ok");
    return { ready, draining: this.#draining, checks };
  }
}
