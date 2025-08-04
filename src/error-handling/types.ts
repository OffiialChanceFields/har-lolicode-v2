export enum ErrorType {
  RATE_LIMITING = 'rate_limiting',
  AUTHENTICATION_FAILURE = 'auth_failure',
  CAPTCHA_REQUIRED = 'captcha_required',
  SERVER_ERROR = 'server_error',
  NETWORK_TIMEOUT = 'network_timeout',
  INVALID_TOKEN = 'invalid_token',
  SESSION_EXPIRED = 'session_expired'
}

export interface RetryStrategy {
  count: number;
  delayMs: number;
  backoffFactor?: number;
}

export interface RecoveryAction {
  type: 'RETRY' | 'MARK_FAILURE' | 'CUSTOM_LOGIC';
  // Additional parameters for the action
}

export interface RecoveryStrategy {
  retryStrategy?: RetryStrategy;
  recoveryAction: RecoveryAction;
  cleanupActions?: any[]; // Replace 'any' with a more specific type
}

export interface ErrorScenario {
  type: ErrorType;
  errorCode: number;
  primaryFlow: any[]; // Replace 'any' with a more specific type
}

export interface ErrorHandlingBlock {
  blockType: 'TRY';
  tryBlock: any[]; // Replace 'any' with a more specific type
  catchBlocks: {
    condition: string;
    action: RecoveryAction;
    retryStrategy?: RetryStrategy;
  }[];
  finallyBlock?: any[]; // Replace 'any' with a more specific type
}

export interface BehavioralFlow {
  // Define the structure of a behavioral flow
  steps: any[]; // Replace 'any' with a more specific type
}
