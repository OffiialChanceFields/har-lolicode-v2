// src/lib/utils.ts
import { HarEntry } from '../types';

/**
 * Sanitizes a string for use as a variable name in LoliCode
 * 
 * @param name - The string to sanitize
 * @returns A valid LoliCode variable name
 */
export function sanitizeVariableName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Escapes special characters in a string for LoliCode
 * 
 * @param value - The string to escape
 * @returns The escaped string
 */
export function escapeLoliCodeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Formats a value for display in logs or comments
 * 
 * @param value - The value to format
 * @param maxLength - Maximum length of the formatted string
 * @returns A formatted string
 */
export function formatValueForDisplay(value: string, maxLength = 50): string {
  if (!value) return '""';
  
  let display = value.replace(/\s+/g, ' ').trim();
  
  if (display.length > maxLength) {
    display = display.substring(0, maxLength) + '...';
  }
  
  return `"${display}"`;
}

/**
 * Creates a circular buffer of fixed size
 * 
 * @param size - The maximum size of the buffer
 * @returns A circular buffer implementation
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private maxSize: number;
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private isFull: boolean = false;

  constructor(size: number) {
    this.maxSize = size;
    this.buffer = new Array(size);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.maxSize;
    
    if (this.isFull) {
      this.tail = (this.tail + 1) % this.maxSize;
    }
    
    if (this.head === this.tail) {
      this.isFull = true;
    }
    
    this.count = this.isFull ? this.maxSize : this.head >= this.tail ? 
      this.head - this.tail : this.maxSize - (this.tail - this.head);
  }

  toArray(): T[] {
    if (this.count === 0) return [];
    
    if (this.head > this.tail) {
      return this.buffer.slice(this.tail, this.head);
    }
    
    return [
      ...this.buffer.slice(this.tail),
      ...this.buffer.slice(0, this.head)
    ];
  }

  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.isFull = false;
  }

  get length(): number {
    return this.count;
  }
}

/**
 * Calculates Levenshtein distance between two strings
 * 
 * @param a - First string
 * @param b - Second string
 * @returns The Levenshtein distance
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}