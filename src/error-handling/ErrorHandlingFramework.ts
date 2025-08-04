// src/error-handling/ErrorHandlingFramework.ts
import { OB2BlockDefinition, ErrorType } from '../types';
import { PatternMatch } from '../flow-analysis/BehavioralPatternMatcher';

export enum ErrorRecoveryStrategy {
  RETRY = 'retry',
  CAPTCHA_SOLVING = 'captcha_solving',
  MFA_CHALLENGE = 'mfa_challenge',
  SESSION_RENEWAL = 'session_renewal',
  FALLBACK_AUTH = 'fallback_auth'
}

export interface ErrorScenario {
  type: ErrorType;
  errorCode: number | string;
  primaryFlow: OB2BlockDefinition[];
  recoveryStrategy: ErrorRecoveryStrategy;
  description: string;
}

export interface RecoveryStrategy {
  recoveryAction: string;
  retryStrategy?: {
    maxRetries: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
  };
  cleanupActions?: string[];
}

export class ErrorHandlingFramework {
  private readonly errorClassifier: ErrorClassifier;
  private readonly recoveryStrategies: Map<ErrorType, RecoveryStrategy>;
  
  constructor() {
    this.errorClassifier = new ErrorClassifier();
    this.recoveryStrategies = this.initializeRecoveryStrategies();
  }
  
  private initializeRecoveryStrategies(): Map<ErrorType, RecoveryStrategy> {
    const strategies = new Map<ErrorType, RecoveryStrategy>();
    
    strategies.set(ErrorType.RATE_LIMITING, {
      recoveryAction: 'DELAY_AND_RETRY',
      retryStrategy: {
        maxRetries: 3,
        backoff: 'exponential',
        initialDelay: 1000
      },
      cleanupActions: ['LOG "Rate limit hit, implementing backoff strategy"']
    });
    
    strategies.set(ErrorType.AUTHENTICATION_FAILURE, {
      recoveryAction: 'RETRY_WITH_CREDENTIALS',
      retryStrategy: {
        maxRetries: 2,
        backoff: 'linear',
        initialDelay: 500
      },
      cleanupActions: ['LOG "Authentication failed, retrying"']
    });
    
    strategies.set(ErrorType.CAPTCHA_REQUIRED, {
      recoveryAction: 'SOLVE_CAPTCHA',
      cleanupActions: ['LOG "CAPTCHA detected, solving"']
    });
    
    strategies.set(ErrorType.SERVER_ERROR, {
      recoveryAction: 'RETRY_WITH_BACKOFF',
      retryStrategy: {
        maxRetries: 3,
        backoff: 'exponential',
        initialDelay: 2000
      },
      cleanupActions: ['LOG "Server error, retrying with backoff"']
    });
    
    strategies.set(ErrorType.NETWORK_TIMEOUT, {
      recoveryAction: 'RETRY_CONNECTION',
      retryStrategy: {
        maxRetries: 2,
        backoff: 'linear',
        initialDelay: 1000
      },
      cleanupActions: ['LOG "Network timeout, retrying connection"']
    });
    
    strategies.set(ErrorType.INVALID_TOKEN, {
      recoveryAction: 'REFRESH_TOKEN',
      cleanupActions: ['LOG "Invalid token, refreshing"']
    });
    
    strategies.set(ErrorType.SESSION_EXPIRED, {
      recoveryAction: 'REAUTHENTICATE',
      cleanupActions: ['LOG "Session expired, reauthenticating"']
    });
    
    return strategies;
  }
  
  generateErrorHandlingBlocks(flow: PatternMatch): OB2BlockDefinition[] {
    const errorScenarios = this.identifyPotentialErrorScenarios(flow);
    return errorScenarios.flatMap(scenario => 
      this.generateErrorHandlingBlock(scenario)
    );
  }
  
  enhanceWithErrorHandling(
    blocks: OB2BlockDefinition[], 
    patternMatches: PatternMatch[]
  ): OB2BlockDefinition[] {
    const enhancedBlocks: OB2BlockDefinition[] = [];
    
    // Wrap the main flow in a try-catch
    enhancedBlocks.push({
      blockType: 'Try',
      blockId: 'main_flow_try',
      parameters: new Map([
        ['tryBlocks', JSON.stringify(blocks)],
        ['catchBlocks', JSON.stringify(this.generateCatchBlocks(patternMatches))],
        ['finallyBlocks', '[]']
      ]),
      outputCaptures: [],
      errorHandling: {
        strategy: 'GLOBAL_ERROR_HANDLING',
        retryCount: 0
      },
      conditionalLogic: []
    });
    
    return enhancedBlocks;
  }
  
  private generateCatchBlocks(patternMatches: PatternMatch[]): any[] {
    const catchBlocks = [];
    
    // Add specific error handlers
    catchBlocks.push({
      condition: 'RESPONSECODE == 429',
      blocks: this.createRateLimitingRecoveryBlocks()
    });
    
    catchBlocks.push({
      condition: 'RESPONSECODE == 401 || RESPONSECODE == 403',
      blocks: this.createAuthFailureRecoveryBlocks()
    });
    
    catchBlocks.push({
      condition: 'RESPONSE.contains("captcha")',
      blocks: this.createCaptchaRecoveryBlocks()
    });
    
    catchBlocks.push({
      condition: 'RESPONSECODE >= 500',
      blocks: this.createServerErrorRecoveryBlocks()
    });
    
    // Add generic error handler
    catchBlocks.push({
      condition: 'true',
      blocks: this.createGenericErrorRecoveryBlocks()
    });
    
    return catchBlocks;
  }
  
  private createRateLimitingRecoveryBlocks(): OB2BlockDefinition[] {
    return [
      {
        blockType: 'Log',
        blockId: 'log_rate_limit',
        parameters: new Map([
          ['message', 'Rate limit hit, implementing backoff strategy']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'SetVariable',
        blockId: 'set_retry_count',
        parameters: new Map([
          ['variable', 'retryCount'],
          ['value', '0']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'While',
        blockId: 'retry_loop',
        parameters: new Map([
          ['condition', 'retryCount < 3'],
          ['bodyBlocks', JSON.stringify([
            {
              blockType: 'Delay',
              blockId: 'backoff_delay',
              parameters: new Map([
                ['milliseconds', '1000 * (2 ^ retryCount)']
              ]),
              outputCaptures: []
            },
            {
              blockType: 'Log',
              blockId: 'log_retry',
              parameters: new Map([
                ['message', 'Retrying after rate limit (attempt ' + (retryCount + 1) + ')']
              ]),
              outputCaptures: []
            },
            {
              blockType: 'SetVariable',
              blockId: 'increment_retry',
              parameters: new Map([
                ['variable', 'retryCount'],
                ['value', 'retryCount + 1']
              ]),
              outputCaptures: []
            }
          ])]
        ]),
        outputCaptures: []
      }
    ];
  }
  
  private createAuthFailureRecoveryBlocks(): OB2BlockDefinition[] {
    return [
      {
        blockType: 'Log',
        blockId: 'log_auth_failure',
        parameters: new Map([
          ['message', 'Authentication failed, retrying']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'SetVariable',
        blockId: 'set_retry_count',
        parameters: new Map([
          ['variable', 'retryCount'],
          ['value', '0']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'While',
        blockId: 'auth_retry_loop',
        parameters: new Map([
          ['condition', 'retryCount < 2'],
          ['bodyBlocks', JSON.stringify([
            {
              blockType: 'Delay',
              blockId: 'retry_delay',
              parameters: new Map([
                ['milliseconds', '500']
              ]),
              outputCaptures: []
            },
            {
              blockType: 'Log',
              blockId: 'log_retry',
              parameters: new Map([
                ['message', 'Retrying authentication (attempt ' + (retryCount + 1) + ')']
              ]),
              outputCaptures: []
            },
            {
              blockType: 'SetVariable',
              blockId: 'increment_retry',
              parameters: new Map([
                ['variable', 'retryCount'],
                ['value', 'retryCount + 1']
              ]),
              outputCaptures: []
            }
          ])]
        ]),
        outputCaptures: []
      }
    ];
  }
  
  private createCaptchaRecoveryBlocks(): OB2BlockDefinition[] {
    return [
      {
        blockType: 'Log',
        blockId: 'log_captcha',
        parameters: new Map([
          ['message', 'CAPTCHA detected, solving']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'Parse',
        blockId: 'parse_captcha',
        parameters: new Map([
          ['variable', 'captchaImage'],
          ['selector', 'img.captcha'],
          ['attribute', 'src']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'HttpRequest',
        blockId: 'solve_captcha',
        parameters: new Map([
          ['method', 'POST'],
          ['url', 'https://api.captchasolver.com/solve'],
          ['postData', JSON.stringify({
            mimeType: 'application/json',
            text: '{"image": "{captchaImage}"}'
          })]
        ]),
        outputCaptures: []
      },
      {
        blockType: 'Parse',
        blockId: 'parse_captcha_solution',
        parameters: new Map([
          ['variable', 'captchaSolution'],
          ['selector', 'solution'],
          ['attribute', 'value']
        ]),
        outputCaptures: []
      }
    ];
  }
  
  private createServerErrorRecoveryBlocks(): OB2BlockDefinition[] {
    return [
      {
        blockType: 'Log',
        blockId: 'log_server_error',
        parameters: new Map([
          ['message', 'Server error, retrying with backoff']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'SetVariable',
        blockId: 'set_retry_count',
        parameters: new Map([
          ['variable', 'retryCount'],
          ['value', '0']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'While',
        blockId: 'server_error_retry',
        parameters: new Map([
          ['condition', 'retryCount < 3'],
          ['bodyBlocks', JSON.stringify([
            {
              blockType: 'Delay',
              blockId: 'backoff_delay',
              parameters: new Map([
                ['milliseconds', '2000 * (2 ^ retryCount)']
              ]),
              outputCaptures: []
            },
            {
              blockType: 'Log',
              blockId: 'log_retry',
              parameters: new Map([
                ['message', 'Retrying after server error (attempt ' + (retryCount + 1) + ')']
              ]),
              outputCaptures: []
            },
            {
              blockType: 'SetVariable',
              blockId: 'increment_retry',
              parameters: new Map([
                ['variable', 'retryCount'],
                ['value', 'retryCount + 1']
              ]),
              outputCaptures: []
            }
          ])]
        ]),
        outputCaptures: []
      }
    ];
  }
  
  private createGenericErrorRecoveryBlocks(): OB2BlockDefinition[] {
    return [
      {
        blockType: 'Log',
        blockId: 'log_generic_error',
        parameters: new Map([
          ['message', 'Unexpected error occurred']
        ]),
        outputCaptures: []
      },
      {
        blockType: 'Mark',
        blockId: 'mark_failure',
        parameters: new Map([
          ['status', 'ERROR'],
          ['message', 'Authentication failed']
        ]),
        outputCaptures: []
      }
    ];
  }
  
  private identifyPotentialErrorScenarios(flow: PatternMatch): ErrorScenario[] {
    const scenarios: ErrorScenario[] = [];
    
    // Rate limiting scenario
    scenarios.push({
      type: ErrorType.RATE_LIMITING,
      errorCode: 429,
      primaryFlow: flow.steps.map(step => ({
        blockType: 'HttpRequest',
        blockId: `request_${step.request.url}`,
        parameters: new Map([
          ['method', step.request.method],
          ['url', step.request.url]
        ]),
        outputCaptures: []
      })),
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      description: 'Rate limiting detected, implementing retry with backoff'
    });
    
    // Authentication failure scenario
    scenarios.push({
      type: ErrorType.AUTHENTICATION_FAILURE,
      errorCode: '401 || 403',
      primaryFlow: flow.steps.map(step => ({
        blockType: 'HttpRequest',
        blockId: `request_${step.request.url}`,
        parameters: new Map([
          ['method', step.request.method],
          ['url', step.request.url]
        ]),
        outputCaptures: []
      })),
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      description: 'Authentication failure, retrying with credentials'
    });
    
    // CAPTCHA scenario
    scenarios.push({
      type: ErrorType.CAPTCHA_REQUIRED,
      errorCode: 'RESPONSE.contains("captcha")',
      primaryFlow: flow.steps.map(step => ({
        blockType: 'HttpRequest',
        blockId: `request_${step.request.url}`,
        parameters: new Map([
          ['method', step.request.method],
          ['url', step.request.url]
        ]),
        outputCaptures: []
      })),
      recoveryStrategy: ErrorRecoveryStrategy.CAPTCHA_SOLVING,
      description: 'CAPTCHA detected, implementing solving mechanism'
    });
    
    return scenarios;
  }
  
  private generateErrorHandlingBlock(scenario: ErrorScenario): OB2BlockDefinition {
    const strategy = this.recoveryStrategies.get(scenario.type);
    if (!strategy) {
      return {
        blockType: 'Log',
        blockId: `error_${scenario.type}`,
        parameters: new Map([
          ['message', `Unhandled error: ${scenario.description}`]
        ]),
        outputCaptures: []
      };
    }
    
    return {
      blockType: 'Try',
      blockId: `try_${scenario.type}`,
      parameters: new Map([
        ['tryBlocks', JSON.stringify(scenario.primaryFlow)],
        ['catchBlocks', JSON.stringify([
          {
            condition: this.getErrorCondition(scenario),
            action: strategy.recoveryAction,
            retryStrategy: strategy.retryStrategy
          }
        ])],
        ['finallyBlocks', JSON.stringify(strategy.cleanupActions?.map(action => ({
          blockType: 'Log',
          blockId: `cleanup_${scenario.type}`,
          parameters: new Map([
            ['message', action]
          ]),
          outputCaptures: []
        })) || [])]
      ]),
      outputCaptures: [],
      errorHandling: {
        strategy: strategy.recoveryAction,
        retryCount: strategy.retryStrategy?.maxRetries || 0
      },
      conditionalLogic: []
    };
  }
  
  private getErrorCondition(scenario: ErrorScenario): string {
    if (typeof scenario.errorCode === 'number') {
      return `RESPONSECODE == ${scenario.errorCode}`;
    }
    return scenario.errorCode;
  }
}

class ErrorClassifier {
  classifyError(entry: any): ErrorType | null {
    if (entry.response.status === 429) {
      return ErrorType.RATE_LIMITING;
    }
    
    if (entry.response.status === 401 || entry.response.status === 403) {
      return ErrorType.AUTHENTICATION_FAILURE;
    }
    
    if (entry.response.status >= 500) {
      return ErrorType.SERVER_ERROR;
    }
    
    if (entry.response.content?.text && 
        /captcha|recaptcha/i.test(entry.response.content.text)) {
      return ErrorType.CAPTCHA_REQUIRED;
    }
    
    if (entry.detectedTokens?.some(t => 
      t.type === 'invalid_token' || t.type === 'token_expired')) {
      return ErrorType.INVALID_TOKEN;
    }
    
    if (entry.request.headers.some(h => 
      h.name.toLowerCase() === 'cookie' && 
      /session=expired/i.test(h.value))) {
      return ErrorType.SESSION_EXPIRED;
    }
    
    return null;
  }
}