/**
 * Local event bus — replaces socket.io for in-app reactivity.
 * Components can emit/listen for events without a server.
 */

type Listener = (...args: any[]) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, fn: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn?: Listener): void {
    if (!fn) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        console.error(`EventBus error on "${event}":`, e);
      }
    });
  }
}

export const eventBus = new EventBus();

// Legacy compat shims so existing code referencing socket helpers doesn't break
export function getSocket() {
  return eventBus;
}

export function connectSocket(_role?: string) {
  return eventBus;
}

export function disconnectSocket() {
  // no-op
}
