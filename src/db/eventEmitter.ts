// Minimal browser-safe EventEmitter replacement for Node's `events` module.
// Only implements the small API surface used by the codebase: `on`, `removeListener`, and `emit`.
export class EventEmitter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback);
  }

  removeListener(event: string, callback: (...args: any[]) => void): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(callback);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // copy to array to avoid mutation issues while iterating
    Array.from(set).forEach(cb => {
      try {
        cb(...args);
      } catch (err) {
        // Avoid letting one listener break others; mirror Node behaviour loosely
        setTimeout(() => { throw err; }, 0);
      }
    });
  }
}
