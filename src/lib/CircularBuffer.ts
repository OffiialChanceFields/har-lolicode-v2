
export class CircularBuffer<T> {
  private buffer: T[];
  private _size: number;
  private head = 0;
  private tail = 0;
  private isFull = false;

  constructor(size: number) {
    this._size = size;
    this.buffer = new Array<T>(size);
  }

  get size(): number {
    return this._size;
  }

  get length(): number {
    if (this.isFull) return this._size;
    if (this.tail >= this.head) return this.tail - this.head;
    return this._size + this.tail - this.head;
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this._size;
    if (this.tail === this.head) {
      this.isFull = true;
      this.head = (this.head + 1) % this._size; 
    }
  }

  shift(): T | undefined {
    if (this.length === 0) return undefined;
    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this._size;
    this.isFull = false;
    return item;
  }

  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.isFull = false;
  }

  toArray(): T[] {
    const arr: T[] = [];
    let i = this.head;
    while (i !== this.tail) {
      arr.push(this.buffer[i]);
      i = (i + 1) % this._size;
    }
    return arr;
  }
}
