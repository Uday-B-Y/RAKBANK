interface GlobalTelemetry {
  primary: string;
  fallbackUsed: boolean;
  attempts: number;
  durationMs: number;
}

interface SelectorHealth {
  totalRuns: number;
  fallbackRuns: number;
}

class LocatorTelemetry {

  private records: GlobalTelemetry[] = [];
  private healthMap: Map<string, SelectorHealth> = new Map();

  record(entry: GlobalTelemetry) {
    this.records.push(entry);

    const existing = this.healthMap.get(entry.primary) || {
      totalRuns: 0,
      fallbackRuns: 0
    };

    existing.totalRuns++;

    if (entry.fallbackUsed) {
      existing.fallbackRuns++;
    }

    this.healthMap.set(entry.primary, existing);
  }

  getAll() {
    return this.records;
  }

  getFallbackRate(): number {
    if (this.records.length === 0) return 0;
    const fallbackCount = this.records.filter(r => r.fallbackUsed).length;
    return (fallbackCount / this.records.length) * 100;
  }

  getSelectorHealth(primary: string) {
    return this.healthMap.get(primary);
  }

  shouldPromoteFallback(primary: string): boolean {
    const health = this.healthMap.get(primary);
    if (!health) return false;

    if (health.totalRuns < 3) return false;

    const fallbackRate =
      (health.fallbackRuns / health.totalRuns) * 100;

    return fallbackRate > 40;
  }

  clear() {
    this.records = [];
    this.healthMap.clear();
  }
}

export const GlobalLocatorTelemetry = new LocatorTelemetry();
