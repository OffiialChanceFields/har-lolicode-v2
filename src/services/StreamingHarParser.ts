// src/services/StreamingHarParser.ts

import { EventEmitter } from '../lib/event-emitter';
import { CircularBuffer } from '../lib/CircularBuffer';
import { HarEntry, HarHeader, HarCookie, HarPostData, HarRequest, HarResponse, HarContent, HarAnalysisResult } from './types';

export interface ParserOptions {
  batchSize?: number;
  validateEntries?: boolean;
  maxEntrySize?: number;
  parseTimeout?: number;
  includeTiming?: boolean;
  includeCache?: boolean;
  skipLargeResponses?: boolean;
  largeResponseThreshold?: number;
}

export interface ParseProgress {
  bytesProcessed: number;
  totalBytes: number;
  entriesParsed: number;
  entriesSkipped: number;
  currentBatch: number;
  estimatedTotal: number;
  percentComplete: number;
}

export interface ParseError {
  message: string;
  position: number;
  entry?: Partial<HarEntry>;
  phase: 'parsing' | 'validation' | 'processing';
}

export interface ParseStatistics {
  totalEntries: number;
  validEntries: number;
  skippedEntries: number;
  parseErrors: number;
  averageEntrySize: number;
  largestEntry: number;
  processingTimeMs: number;
  memoryUsed: number;
  estimatedTotal?: number;
}

export class StreamingHarParser extends EventEmitter {
  private static readonly DEFAULT_BATCH_SIZE = 100;
  private static readonly MAX_ENTRY_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly LARGE_RESPONSE_THRESHOLD = 1024 * 1024; // 1MB
  private static readonly PARSE_TIMEOUT = 60000; // 60 seconds

  private options: Required<ParserOptions>;
  private statistics: ParseStatistics;
  private parseStartTime: number = 0;
  private abortController: AbortController;

  constructor(options: ParserOptions = {}) {
    super();
    
    this.options = {
      batchSize: options.batchSize || StreamingHarParser.DEFAULT_BATCH_SIZE,
      validateEntries: options.validateEntries !== false,
      maxEntrySize: options.maxEntrySize || StreamingHarParser.MAX_ENTRY_SIZE,
      parseTimeout: options.parseTimeout || StreamingHarParser.PARSE_TIMEOUT,
      includeTiming: options.includeTiming !== false,
      includeCache: options.includeCache !== false,
      skipLargeResponses: options.skipLargeResponses || false,
      largeResponseThreshold: options.largeResponseThreshold || StreamingHarParser.LARGE_RESPONSE_THRESHOLD
    };

    this.statistics = {
      totalEntries: 0,
      validEntries: 0,
      skippedEntries: 0,
      parseErrors: 0,
      averageEntrySize: 0,
      largestEntry: 0,
      processingTimeMs: 0,
      memoryUsed: 0
    };

    this.abortController = new AbortController();
  }

  // Synchronous parsing with event emission
  parse(harContent: string): void {
    this.parseStartTime = performance.now();
    
    try {
      this.emit('start', { totalBytes: harContent.length });
      
      // Validate HAR structure
      const har = this.validateAndParseHar(harContent);
      
      // Process entries
      const entries = har.log.entries;
      this.statistics.estimatedTotal = entries.length;
      
      let processedCount = 0;
      const batchBuffer: HarEntry[] = [];
      
      for (let i = 0; i < entries.length; i++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Parsing aborted');
        }
        
        try {
          const entry = this.processEntry(entries[i], i);
          
          if (entry) {
            batchBuffer.push(entry);
            this.statistics.validEntries++;
            
            // Emit individual entry
            this.emit('entry', entry);
            
            // Process batch if full
            if (batchBuffer.length >= this.options.batchSize) {
              this.emit('batch', [...batchBuffer]);
              batchBuffer.length = 0;
            }
          } else {
            this.statistics.skippedEntries++;
          }
          
          processedCount++;
          
          // Emit progress
          if (processedCount % 10 === 0) {
            this.emitProgress(processedCount, entries.length, harContent.length);
          }
          
        } catch (error) {
          this.handleEntryError(error, i, entries[i]);
        }
      }
      
      // Process remaining entries
      if (batchBuffer.length > 0) {
        this.emit('batch', batchBuffer);
      }
      
      // Finalize statistics
      this.finalizeStatistics();
      
      this.emit('end', this.statistics);
      
    } catch (error) {
      this.emit('error', this.createParseError(error, 0, 'parsing'));
    }
  }

  // Asynchronous streaming parser
  async *parseHarEntriesAsync(harContent: string): AsyncGenerator<HarEntry[]> {
    const entriesBuffer = new CircularBuffer<HarEntry>(this.options.batchSize);
    const jsonStream = this.createJsonStream(harContent);
    
    this.parseStartTime = performance.now();
    this.emit('start', { totalBytes: harContent.length });

    try {
      for await (const entry of jsonStream) {
        if (this.abortController.signal.aborted) {
          throw new Error('Parsing aborted');
        }
        
        entriesBuffer.push(entry);
        this.emit('entry', entry);
        
        if (entriesBuffer.length >= this.options.batchSize) {
          const batch = entriesBuffer.toArray();
          yield batch;
          this.emit('batch', batch);
          entriesBuffer.clear();
        }
      }

      // Yield remaining entries
      if (entriesBuffer.length > 0) {
        const finalBatch = entriesBuffer.toArray();
        yield finalBatch;
        this.emit('batch', finalBatch);
      }
      
      this.finalizeStatistics();
      this.emit('end', this.statistics);
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Abort ongoing parsing
  abort(): void {
    this.abortController.abort();
    this.emit('abort');
  }

  // Get current statistics
  getStatistics(): ParseStatistics {
    return { ...this.statistics };
  }

  private validateAndParseHar(harContent: string): any {
    if (!harContent || typeof harContent !== 'string') {
      throw new Error('HAR content must be a non-empty string');
    }

    let har: any;
    try {
      har = JSON.parse(harContent);
    } catch (error) {
      throw new Error(`Invalid JSON in HAR file: ${error.message}`);
    }

    // Validate HAR structure
    if (!har || typeof har !== 'object') {
      throw new Error('HAR file must contain a valid JSON object');
    }

    if (!har.log) {
      throw new Error('HAR file must contain a "log" property');
    }

    if (!Array.isArray(har.log.entries)) {
      throw new Error('HAR log must contain an "entries" array');
    }

    // Validate HAR version
    if (har.log.version) {
      const version = har.log.version;
      if (!['1.1', '1.2'].includes(version)) {
        this.emit('warning', `HAR version ${version} may not be fully supported`);
      }
    }

    return har;
  }

  private async *createJsonStream(harContent: string): AsyncGenerator<HarEntry> {
    const har = this.validateAndParseHar(harContent);
    const entries = har.log.entries;
    
    let processedBytes = 0;
    const totalBytes = harContent.length;
    
    for (let i = 0; i < entries.length; i++) {
      if (this.abortController.signal.aborted) {
        break;
      }
      
      // Estimate progress
      processedBytes = Math.floor((i / entries.length) * totalBytes);
      
      if (i % 10 === 0) {
        this.emitProgress(i, entries.length, processedBytes);
      }
      
      try {
        const processedEntry = this.processEntry(entries[i], i);
        if (processedEntry) {
          yield processedEntry;
          this.statistics.validEntries++;
        } else {
          this.statistics.skippedEntries++;
        }
      } catch (error) {
        this.handleEntryError(error, i, entries[i]);
      }
      
      // Allow event loop to process other tasks
      if (i % 100 === 0) {
        await this.delay(0);
      }
    }
  }

  private processEntry(rawEntry: any, index: number): HarEntry | null {
    try {
      // Validate entry structure
      if (!this.isValidEntry(rawEntry)) {
        this.emit('warning', `Invalid entry at index ${index}`);
        return null;
      }

      // Check entry size
      const entrySize = JSON.stringify(rawEntry).length;
      if (entrySize > this.options.maxEntrySize) {
        this.emit('warning', `Entry at index ${index} exceeds size limit (${entrySize} bytes)`);
        return null;
      }

      // Update statistics
      this.statistics.totalEntries++;
      this.statistics.largestEntry = Math.max(this.statistics.largestEntry, entrySize);
      this.statistics.averageEntrySize = 
        (this.statistics.averageEntrySize * (this.statistics.totalEntries - 1) + entrySize) / 
        this.statistics.totalEntries;

      // Process request
      const request = this.processRequest(rawEntry.request);
      
      // Process response
      const response = this.processResponse(rawEntry.response);
      
      // Check if we should skip large responses
      if (this.options.skipLargeResponses && 
          response.content.size > this.options.largeResponseThreshold) {
        response.content.text = '[Content truncated due to size]';
      }

      // Create processed entry
      const entry: HarEntry = {
        startedDateTime: rawEntry.startedDateTime,
        time: rawEntry.time || 0,
        request,
        response,
        cache: this.options.includeCache ? rawEntry.cache : {},
        timings: this.options.includeTiming ? rawEntry.timings : {},
        serverIPAddress: rawEntry.serverIPAddress,
        connection: rawEntry.connection,
        comment: rawEntry.comment
      };

      return entry;
      
    } catch (error) {
      throw new Error(`Failed to process entry at index ${index}: ${error.message}`);
    }
  }

  private processRequest(rawRequest: any): HarRequest {
    return {
      method: rawRequest.method || 'GET',
      url: rawRequest.url || '',
      httpVersion: rawRequest.httpVersion || 'HTTP/1.1',
      headers: this.processHeaders(rawRequest.headers),
      queryString: rawRequest.queryString || [],
      cookies: this.processCookies(rawRequest.cookies),
      headersSize: rawRequest.headersSize || -1,
      bodySize: rawRequest.bodySize || -1,
      postData: rawRequest.postData ? this.processPostData(rawRequest.postData) : undefined
    };
  }

  private processResponse(rawResponse: any): HarResponse {
    return {
      status: rawResponse.status || 0,
      statusText: rawResponse.statusText || '',
      httpVersion: rawResponse.httpVersion || 'HTTP/1.1',
      headers: this.processHeaders(rawResponse.headers),
      cookies: this.processCookies(rawResponse.cookies),
      content: this.processContent(rawResponse.content),
      redirectURL: rawResponse.redirectURL || '',
      headersSize: rawResponse.headersSize || -1,
      bodySize: rawResponse.bodySize || -1
    };
  }

  private processHeaders(rawHeaders: any[]): HarHeader[] {
    if (!Array.isArray(rawHeaders)) return [];
    
    return rawHeaders
      .filter(h => h && typeof h === 'object' && h.name && h.value !== undefined)
      .map(h => ({
        name: String(h.name),
        value: String(h.value)
      }));
  }

  private processCookies(rawCookies: any[]): HarCookie[] {
    if (!Array.isArray(rawCookies)) return [];
    
    return rawCookies
      .filter(c => c && typeof c === 'object' && c.name)
      .map(c => ({
        name: String(c.name),
        value: String(c.value || ''),
        path: c.path,
        domain: c.domain,
        expires: c.expires,
        httpOnly: Boolean(c.httpOnly),
        secure: Boolean(c.secure),
        sameSite: c.sameSite
      }));
  }

  private processPostData(rawPostData: any): HarPostData {
    return {
      mimeType: rawPostData.mimeType || 'application/octet-stream',
      text: rawPostData.text,
      params: Array.isArray(rawPostData.params) ? rawPostData.params : []
    };
  }

  private processContent(rawContent: any): HarContent {
    if (!rawContent || typeof rawContent !== 'object') {
      return {
        size: 0,
        mimeType: 'application/octet-stream'
      };
    }

    return {
      size: rawContent.size || 0,
      compression: rawContent.compression,
      mimeType: rawContent.mimeType || 'application/octet-stream',
      text: rawContent.text,
      encoding: rawContent.encoding
    };
  }

  private isValidEntry(entry: any): boolean {
    if (!entry || typeof entry !== 'object') return false;
    if (!entry.request || typeof entry.request !== 'object') return false;
    if (!entry.response || typeof entry.response !== 'object') return false;
    if (!entry.request.url || typeof entry.request.url !== 'string') return false;
    if (!entry.startedDateTime) return false;
    
    if (this.options.validateEntries) {
      // Additional validation
      if (!entry.request.method || typeof entry.request.method !== 'string') return false;
      if (typeof entry.response.status !== 'number') return false;
      if (!Array.isArray(entry.request.headers)) return false;
      if (!Array.isArray(entry.response.headers)) return false;
    }
    
    return true;
  }

  private handleEntryError(error: any, index: number, rawEntry: any): void {
    this.statistics.parseErrors++;
    
    const parseError: ParseError = {
      message: error.message || 'Unknown error',
      position: index,
      entry: rawEntry ? { 
        startedDateTime: rawEntry.startedDateTime,
        request: { 
          url: rawEntry.request?.url,
          method: rawEntry.request?.method 
        }
      } : undefined,
      phase: 'processing'
    };
    
    this.emit('entryError', parseError);
  }

  private emitProgress(current: number, total: number, bytesProcessed: number): void {
    const progress: ParseProgress = {
      bytesProcessed,
      totalBytes: bytesProcessed, // Approximate
      entriesParsed: this.statistics.validEntries,
      entriesSkipped: this.statistics.skippedEntries,
      currentBatch: Math.floor(current / this.options.batchSize),
      estimatedTotal: total,
      percentComplete: Math.round((current / total) * 100)
    };
    
    this.emit('progress', progress);
  }

  private finalizeStatistics(): void {
    this.statistics.processingTimeMs = performance.now() - this.parseStartTime;
    this.statistics.memoryUsed = 0;
  }

  private createParseError(error: any, position: number, phase: ParseError['phase']): ParseError {
    return {
      message: error.message || 'Unknown parse error',
      position,
      phase
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Specialized parser for very large HAR files
export class LargeFileHarParser extends StreamingHarParser {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks

  async *parseFileInChunks(
    fileReader: AsyncIterable<string>
  ): AsyncGenerator<HarEntry[]> {
    let buffer = '';
    let inEntries = false;
    let depth = 0;
    let entryStart = -1;
    const batch: HarEntry[] = [];

    for await (const chunk of fileReader) {
      buffer += chunk;

      // Look for entries array
      if (!inEntries) {
        const entriesMatch = buffer.match(/"entries"\s*:\s*\[/);
        if (entriesMatch) {
          inEntries = true;
          buffer = buffer.substring(entriesMatch.index! + entriesMatch[0].length);
        } else {
          // Keep last part of buffer for next iteration
          buffer = buffer.slice(-100);
          continue;
        }
      }

      // Parse entries from buffer
      let i = 0;
      while (i < buffer.length) {
        const char = buffer[i];

        if (char === '{' && depth === 0) {
          entryStart = i;
        }

        if (char === '{') depth++;
        else if (char === '}') depth--;

        if (char === '}' && depth === 0 && entryStart !== -1) {
          // Found complete entry
          const entryJson = buffer.substring(entryStart, i + 1);
          
          try {
            const rawEntry = JSON.parse(entryJson);
            const entry = this.processEntry(rawEntry, batch.length);
            
            if (entry) {
              batch.push(entry);
              this.emit('entry', entry);
              
              if (batch.length >= this.options.batchSize) {
                yield [...batch];
                batch.length = 0;
              }
            }
          } catch (error) {
            this.emit('warning', `Failed to parse entry: ${error.message}`);
          }
          
          entryStart = -1;
        }

        if (char === ']' && depth === 0) {
          // End of entries array
          inEntries = false;
          break;
        }

        i++;
      }

      // Keep unparsed part for next iteration
      if (entryStart !== -1) {
        buffer = buffer.substring(entryStart);
      } else {
        buffer = buffer.substring(i);
      }
    }

    // Yield remaining entries
    if (batch.length > 0) {
      yield batch;
    }
  }
}

// Helper function to create a parser with specific options
export function createHarParser(options?: ParserOptions): StreamingHarParser {
  return new StreamingHarParser(options);
}

// Export types
export type { HarEntry, ParseProgress, ParseError, ParseStatistics, HarAnalysisResult };
