import { HarEntry } from '../services/types';

export interface AuthenticationStep {
  urlPattern: RegExp;
  methodPattern?: string[];
  statusPattern?: number[];
  headerPattern?: Record<string, RegExp>;
  bodyPattern?: RegExp;
  required: boolean;
  timing?: {
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
  };
}

export interface TokenPattern {
  name: string;
  pattern: RegExp;
  location: 'url' | 'response' | 'header' | 'cookie';
}

export interface AuthenticationPattern {
  name: string;
  confidence: number;
  pattern: AuthenticationStep[];
  tokenPatterns: TokenPattern[];
  extract?: (steps: HarEntry[]) => Record<string, unknown>;
}

export class AuthenticationPatternLibrary {
  private readonly patterns: Map<string, AuthenticationPattern> = new Map();

  constructor() {
    this.initializePatternDatabase();
  }

  public getPattern(name: string): AuthenticationPattern | undefined {
    return this.patterns.get(name);
  }

  public getAllPatterns(): [string, AuthenticationPattern][] {
    return Array.from(this.patterns.entries());
  }

  private initializePatternDatabase(): void {
    // OAuth 2.0 Authorization Code Flow
    this.patterns.set('oauth2_auth_code', {
      name: 'OAuth 2.0 Authorization Code Flow',
      confidence: 0.95,
      pattern: [
        {
          urlPattern: /\/oauth\/authorize/,
          methodPattern: ['GET'],
          required: true
        },
        {
          urlPattern: /\/oauth\/token/,
          methodPattern: ['POST'],
          required: true,
          timing: { maxDelaySeconds: 300 }
        }
      ],
      tokenPatterns: [
        { name: 'state', pattern: /state=([^&]+)/, location: 'url' },
        { name: 'code', pattern: /code=([^&]+)/, location: 'url' },
        {
          name: 'access_token',
          pattern: /"access_token":"([^"]+)"/,
          location: 'response'
        }
      ],
      extract: (steps) => ({
        authorizationUrl: steps[0]?.request.url,
        tokenUrl: steps[1]?.request.url
      })
    });

    // Form-based Authentication with CSRF
    this.patterns.set('form_auth_csrf', {
      name: 'Form-based Authentication with CSRF Protection',
      confidence: 0.9,
      pattern: [
        {
          urlPattern: /\/login/,
          methodPattern: ['GET'],
          required: true
        },
        {
          urlPattern: /\/login/,
          methodPattern: ['POST'],
          required: true
        }
      ],
      tokenPatterns: [
        {
          name: '_token',
          pattern: /name="_token" value="([^"]+)"/,
          location: 'response'
        },
        {
          name: 'csrf_token',
          pattern: /csrf_token['"]\s*:\s*['"]([^'"]+)['"]/,
          location: 'response'
        }
      ]
    });

    // JWT-based API Authentication
    this.patterns.set('jwt_api_auth', {
      name: 'JWT-based API Authentication',
      confidence: 0.88,
      pattern: [
        {
          urlPattern: /\/api\/auth\/login/,
          methodPattern: ['POST'],
          required: true
        }
      ],
      tokenPatterns: [
        {
          name: 'access_token',
          pattern: /"access_token":"([^"]+)"/,
          location: 'response'
        },
        {
          name: 'refresh_token',
          pattern: /"refresh_token":"([^"]+)"/,
          location: 'response'
        }
      ]
    });
  }
}
