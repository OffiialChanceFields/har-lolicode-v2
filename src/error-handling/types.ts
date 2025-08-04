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

export interface Action {
  // Define a more specific structure for actions
  type: string;
  payload?: Record<string, unknown>;
}

export interface RecoveryStrategy {
  retryStrategy?: RetryStrategy;
  recoveryAction: RecoveryAction;
  cleanupActions?: Action[];
}

export interface ErrorScenario {
  type: ErrorType;
  errorCode: number;
  primaryFlow: Action[];
}

export interface ErrorHandlingBlock {
  blockType: 'TRY';
  tryBlock: Action[];
  catchBlocks: {
    condition: string;
    action: RecoveryAction;
    retryStrategy?: RetryStrategy;
  }[];
  finallyBlock?: Action[];
}

export interface BehavioralFlow {
  // Define the structure of a behavioral flow
  steps: Action[];
}
