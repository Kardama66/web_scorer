export class Semaphore {
  private available: number;
  private queue: Array<(release: () => void) => void> = [];

  constructor(private readonly max: number) {
    this.available = max;
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this.queue.push((release) => resolve(release));
    });
  }

  private release(): void {
    this.available += 1;
    const next = this.queue.shift();
    if (next) {
      this.available -= 1;
      next(() => this.release());
    }
  }
}
