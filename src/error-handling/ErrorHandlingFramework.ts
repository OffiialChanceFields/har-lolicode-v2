// src/error-handling/ErrorHandlingFramework.ts

import { ErrorType } from './types';

/**
 * A standardized error class for the application.
 * Each error has a specific type, a user-friendly message, and optional details.
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly details: unknown;

  constructor(type: ErrorType, message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Maps error types to user-friendly messages.
 */
export const errorMessages: { [key in ErrorType]: string } = {
  // HAR File Errors
  [ErrorType.EMPTY_HAR]: 'The HAR file is empty. Please provide a valid HAR file.',
  [ErrorType.INVALID_HAR_FORMAT]: 'Invalid HAR file structure. The file does not conform to the HAR specification.',
  [ErrorType.HAR_PARSING_ERROR]: 'Failed to parse the HAR file. It may be corrupted or not a valid JSON file.',
  [ErrorType.NO_REQUESTS_FOUND]: 'No network requests found in the HAR file.',
  [ErrorType.NO_RELEVANT_REQUESTS]: 'No relevant authentication or API requests were found to analyze.',

  // Flow Analysis Errors
  [ErrorType.STATE_TRANSITION_ERROR]: 'Could not determine the state transitions from the requests.',
  [ErrorType.TEMPORAL_CORRELATION_ERROR]: 'Failed to correlate requests based on their timing.',
  [ErrorType.BEHAVIORAL_PATTERN_ERROR]: 'Could not identify a known behavioral pattern in the user flow.',
  [ErrorType.FLOW_VALIDATION_ERROR]: 'The analyzed flow is invalid or incomplete.',

  // Syntax Compliance Errors
  [ErrorType.SYNTAX_VALIDATION_ERROR]: 'The generated script has syntax errors.',
  [ErrorType.BLOCK_OPTIMIZATION_ERROR]: 'Failed to optimize the script blocks.',
  [ErrorType.VARIABLE_LIFECYCLE_ERROR]: 'Error managing variable lifecycles in the script.',

  // Token and Dependency Errors
  [ErrorType.TOKEN_DETECTION_ERROR]: 'Could not detect authentication tokens.',
  [ErrorType.REQUEST_DEPENDENCY_ERROR]: 'Failed to analyze dependencies between requests.',
};

/**
 * Creates and throws a standardized application error.
 * @param type The type of the error.
 * @param details Optional additional details about the error.
 */
export const throwError = (type: ErrorType, details?: unknown): never => {
  const message = errorMessages[type] || 'An unexpected error occurred.';
  throw new AppError(type, message, details);
};