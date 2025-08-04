// src/lib/event-emitter.ts
type Listener<T extends unknown[]> = (...args: T) => void;

export class EventEmitter {
  private events: Record<string, Listener<unknown[]>[]> = {};

  on<T extends unknown[]>(eventName: string, listener: Listener<T>): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener as Listener<unknown[]>);
  }

  emit<T extends unknown[]>(eventName: string, ...args: T): void {
    const listeners = this.events[eventName];
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  off<T extends unknown[]>(eventName: string, listenerToRemove: Listener<T>): void {
    const listeners = this.events[eventName];
    if (listeners) {
      this.events[eventName] = listeners.filter(
        (listener) => listener !== (listenerToRemove as Listener<unknown[]>)
      );
    }
  }
}
