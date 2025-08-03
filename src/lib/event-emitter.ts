// src/lib/event-emitter.ts
type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: Record<string, Listener[]> = {};

  on(eventName: string, listener: Listener): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  emit(eventName: string, ...args: any[]): void {
    const listeners = this.events[eventName];
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  off(eventName: string, listenerToRemove: Listener): void {
    const listeners = this.events[eventName];
    if (listeners) {
      this.events[eventName] = listeners.filter(listener => listener !== listenerToRemove);
    }
  }
}
