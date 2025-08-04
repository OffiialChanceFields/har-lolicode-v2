// src/core/AsyncHarProcessor.ts

import { Har, HarEntry } from '../types';
import { throwError } from '../error-handling/ErrorHandlingFramework';
import { ErrorType } from '../error-handling/types';
import { EventEmitter } from '../lib/event-emitter';

// Define the events that the AsyncHarProcessor can emit
export interface HarProcessorEvents {
  onProgress: (progress: number) => void;
  onStatusUpdate: (status: string) => void;
  onError: (error: Error) => void;
  onComplete: (har: Har) => void;
}

/**
 * Asynchronously processes a HAR file with real-time feedback.
 * This class reads a file, parses it as JSON, and validates its structure.
 */
export class AsyncHarProcessor extends EventEmitter<HarProcessorEvents> {
  private file: File;

  constructor(file: File) {
    super();
    this.file = file;
  }

  /**
   * Starts the HAR file processing.
   * Emits progress, status, error, and completion events.
   */
  public async process(): Promise<void> {
    try {
      this.emit('onStatusUpdate', 'Reading HAR file...');
      const fileContent = await this.readFileWithProgress();
      
      this.emit('onStatusUpdate', 'Parsing HAR content...');
      const har = this.parseAndValidateHar(fileContent);

      this.emit('onStatusUpdate', 'HAR file processed successfully.');
      this.emit('onComplete', har);

    } catch (error) {
      this.emit('onError', error as Error);
    }
  }

  /**
   * Reads the file content and emits progress updates.
   */
  private readFileWithProgress(): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(throwError(ErrorType.HAR_PARSING_ERROR, 'Error reading the file.'));
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.emit('onProgress', progress);
        }
      };

      reader.readAsText(this.file);
    });
  }

  /**
   * Parses the HAR content and validates its structure.
   * @param content The string content of the HAR file.
   * @returns The parsed HAR object.
   */
  private parseAndValidateHar(content: string): Har {
    if (!content) {
      throwError(ErrorType.EMPTY_HAR);
    }

    try {
      const har = JSON.parse(content);

      if (!har.log || !Array.isArray(har.log.entries)) {
        throwError(ErrorType.INVALID_HAR_FORMAT);
      }
      
      if (har.log.entries.length === 0) {
        throwError(ErrorType.NO_REQUESTS_FOUND);
      }

      return har;

    } catch (e) {
      throwError(ErrorType.HAR_PARSING_ERROR, 'The file is not a valid JSON.');
    }
  }
}
