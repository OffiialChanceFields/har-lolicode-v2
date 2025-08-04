/**
 * @file Contains the implementation of the AsyncHarProcessor class for processing HAR entries.
 */

/**
 * Represents the request part of a HAR entry.
 */
export interface HarRequest {
  method: string;
  url: string;
  headers: Array<{ name: string; value: string }>;
  postData?: {
    text: string;
  };
}

/**
 * Represents a single entry in a HAR file.
 */
export interface HarEntry {
  request: HarRequest;
}

/**
 * Represents the result of processing a single HAR entry.
 */
export interface ProcessingResult {
  originalEntry: HarEntry;
  responseStatus: number;
  responseBody: string;
  error?: string;
}

/**
 * Asynchronously processes an array of HAR (HTTP Archive) entries.
 * It replays the recorded HTTP requests, captures the responses, and handles
 * potential errors gracefully, with a configurable concurrency limit.
 */
export class AsyncHarProcessor {
  private readonly concurrencyLimit: number;

  /**
   * Constructs an instance of AsyncHarProcessor.
   * @param options - Configuration options for the processor.
   * @param options.concurrencyLimit - The maximum number of concurrent requests. Defaults to 5.
   */
  constructor(options: { concurrencyLimit?: number } = {}) {
    this.concurrencyLimit = options.concurrencyLimit ?? 5;
  }

  /**
   * Processes an array of HAR entries concurrently.
   * For each entry, it replays the HTTP request and captures the response.
   * Failed requests are handled gracefully and do not stop the processing of other entries.
   *
   * @param entries - An array of HAR entries to process.
   * @returns A promise that resolves to an array of ProcessingResult objects.
   */
  public async process(entries: HarEntry[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const queue = [...entries];
    let activePromises = 0;
    const executing: Promise<void>[] = [];

    const processEntry = async (entry: HarEntry): Promise<void> => {
      try {
        const headers = new Headers();
        entry.request.headers.forEach(header => {
          // Some headers are restricted and cannot be set programmatically.
          try {
            headers.append(header.name, header.value);
          } catch (e) {
            // Ignore restricted headers.
          }
        });

        const response = await fetch(entry.request.url, {
          method: entry.request.method,
          headers,
          body: entry.request.postData?.text,
        });

        const responseBody = await response.text();
        results.push({
          originalEntry: entry,
          responseStatus: response.status,
          responseBody,
        });
      } catch (error) {
        results.push({
          originalEntry: entry,
          responseStatus: 0,
          responseBody: '',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const run = async (): Promise<void> => {
      while (queue.length > 0) {
        if (activePromises >= this.concurrencyLimit) {
          await Promise.race(executing);
          continue;
        }

        const entry = queue.shift();
        if (entry) {
          activePromises++;
          const promise = processEntry(entry).finally(() => {
            activePromises--;
            executing.splice(executing.indexOf(promise), 1);
          });
          executing.push(promise);
        }
      }
      await Promise.all(executing);
    };

    await run();

    // Ensure results are in the same order as the input entries
    const entryMap = new Map<HarEntry, ProcessingResult>();
    results.forEach(result => entryMap.set(result.originalEntry, result));
    return entries.map(entry => entryMap.get(entry)!);
  }
}