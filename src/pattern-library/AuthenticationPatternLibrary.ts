// src/pattern-library/AuthenticationPatternLibrary.ts
import { HarEntry } from '../types';

/**
 * Enhanced pattern matching that handles more flexible authentication flows
 * - More forgiving URL patterns
 * - Broader HTTP method support
 * - Flexible status code ranges
 * - Looser timing constraints
 */
export enum AuthenticationPatternId {
  OAUTH2_AUTH_CODE = 'oauth2_auth_code',
  FORM_AUTH_CSRF = 'form_auth_csrf',
  JWT_API_AUTH = 'jwt_api_auth',
  SAML_AUTH = 'saml_auth',
  BASIC_AUTH = 'basic_auth',
  API_KEY_AUTH = 'api_key_auth',
  BEARER_TOKEN_AUTH = 'bearer_token_auth',
  DIGEST_AUTH = 'digest_auth',
  OPENID_CONNECT = 'openid_connect',
  FORM_AUTH_NO_CSRF = 'form_auth_no_csrf',
  SESSION_COOKIE_AUTH = 'session_cookie_auth',
  MFA_SMS = 'mfa_sms',
  MFA_TOTP = 'mfa_totp',
  MFA_PUSH = 'mfa_push'
}

// Common patterns for authentication endpoints
const AUTH_ENDPOINT_PATTERNS = [
  /\/(login|signin|auth|authenticate|session|token|account|access)/i,
  /login|auth|token/i,
  /\/api\/v?\d*\/(auth|login|token)/i
];

// Common patterns for response status codes
const SUCCESS_STATUS_CODES = [200, 201, 204, 301, 302, 303, 307, 308];
const ERROR_STATUS_CODES = [400, 401, 403, 429];

// Flexible timing constraints
const FLEXIBLE_TIMING = { minDelaySeconds: 0, maxDelaySeconds: 15 };

export interface AuthenticationPattern {
  id: AuthenticationPatternId;
  name: string;
  confidence: number;
  pattern: Array<Partial<RequestPattern>>;
  extract?: (matches: HarEntry[]) => Record<string, unknown>;
  tokenPatterns?: Array<{
    name: string;
    pattern: RegExp;
    location: 'url' | 'header' | 'body' | 'response';
  }>;
}
interface RequestPattern {
  urlPattern?: RegExp | RegExp[];
  methodPattern?: string[];
  statusPattern?: number[];
  headerPattern?: Record<string, RegExp>;
  bodyPattern?: RegExp;
  timing?: {
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
  };
}

export class AuthenticationPatternLibrary {
  private readonly patterns: Map<AuthenticationPatternId, AuthenticationPattern>;
  
  constructor() {
    this.patterns = new Map();
    this.initializePatternDatabase(); // Initialize with flexible patterns
  }
  
  private initializePatternDatabase(): void {
    // OAuth 2.0 Authorization Code Flow
    this.patterns.set(AuthenticationPatternId.OAUTH2_AUTH_CODE, {
      id: AuthenticationPatternId.OAUTH2_AUTH_CODE,
      name: 'OAuth 2.0 Flexible Authorization Flow',
      confidence: 0.95,
      pattern: [
        {
          urlPattern: [/\/oauth\/authorize/, /\/connect\/authorize/],
          methodPattern: ['GET', 'POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [/\/callback/, /\/redirect/, /\/oauth2\/callback/],
          methodPattern: ['GET', 'POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [/\/oauth\/token/, /\/token/, /\/connect\/token/],
          methodPattern: ['POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        authorizationEndpoint: matches[0]?.request.url,
        callbackEndpoint: matches[1]?.request.url,
        tokenEndpoint: matches[2]?.request.url,
        details: {
          state: this.extractOAuthState(matches),
        }
      }),
      tokenPatterns: [
        { name: 'state', pattern: /state=([^&]+)/, location: 'url' },
        { name: 'code', pattern: /code=([^&]+)/, location: 'url' },
        { name: 'access_token', pattern: /"access_token":"([^"]+)"/, location: 'response' },
        { name: 'refresh_token', pattern: /"refresh_token":"([^"]+)"/, location: 'response' }
      ]
    });
    
    // Form-based Authentication with CSRF
    this.patterns.set(AuthenticationPatternId.FORM_AUTH_CSRF, {
      id: AuthenticationPatternId.FORM_AUTH_CSRF,
      name: 'Flexible Form-based Authentication',
      confidence: 0.90,
      pattern: [
        {
          urlPattern: AUTH_ENDPOINT_PATTERNS,
          methodPattern: ['GET'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: AUTH_ENDPOINT_PATTERNS,
          methodPattern: ['POST', 'PUT'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        loginFormEndpoint: matches[0]?.request.url,
        authenticationEndpoint: matches[1]?.request.url,
        credentials: this.extractCredentials(matches[1]),
        details: {
          cookies: matches[1]?.response.headers.filter(h => h.name.toLowerCase() === 'set-cookie')
        }
      }),
      tokenPatterns: [
        { name: '_token', pattern: /name="_token" value="([^"]+)"/, location: 'response' },
        { name: 'csrf_token', pattern: /csrf_token['"]\s*:\s*['"]([^'"]+)['"]/, location: 'response' },
        { name: 'session_id', pattern: /set-cookie:\s*sessionid=([^;]+)/i, location: 'header' }
      ]
    });
    
    // JWT-based API Authentication
    this.patterns.set(AuthenticationPatternId.JWT_API_AUTH, {
      id: AuthenticationPatternId.JWT_API_AUTH,
      name: 'Flexible JWT-based Authentication',
      confidence: 0.88,
      pattern: [
        {
          urlPattern: [
            /\/api\/auth\/login/,
            /\/api\/v?\d+\/(auth|login|token)/,
            /\/login/,
            /\/token/
          ],
          methodPattern: ['POST', 'GET'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        loginEndpoint: matches[0]?.request.url,
        accessToken: this.extractJwtToken(matches[0], 'access_token'),
        refreshToken: this.extractJwtToken(matches[0], 'refresh_token'),
        details: {
          responseBody: matches[0]?.response.content.text
        }
      }),
      tokenPatterns: [
        { name: 'access_token', pattern: /"access_token":"([^"]+)"/, location: 'response' },
        { name: 'refresh_token', pattern: /"refresh_token":"([^"]+)"/, location: 'response' }
      ]
    });
    
    // SAML Authentication Flow
    this.patterns.set(AuthenticationPatternId.SAML_AUTH, {
      id: AuthenticationPatternId.SAML_AUTH,
      name: 'Flexible SAML Authentication',
      confidence: 0.85,
      pattern: [
        {
          urlPattern: [
            /\/saml\/login/,
            /\/sso\/login/,
            /\/auth\/saml/
          ],
          methodPattern: ['GET', 'POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [
            /\/saml\/acs/,
            /\/saml\/callback/,
            /\/sso\/callback/
          ],
          methodPattern: ['POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        loginEndpoint: matches[0]?.request.url,
        assertionConsumerService: matches[1]?.request.url,
        samlResponse: this.extractSamlResponse(matches[1]),
        details: {
          requestBody: matches[1]?.request.postData?.text
        }
      }),
      tokenPatterns: [
        { name: 'saml_response', pattern: /name="SAMLResponse"\s+value="([^"]+)"/, location: 'body' },
        { name: 'relay_state', pattern: /name="RelayState"\s+value="([^"]+)"/, location: 'body' }
      ]
    });
    
    // Basic Authentication
    this.patterns.set(AuthenticationPatternId.BASIC_AUTH, {
      id: AuthenticationPatternId.BASIC_AUTH,
      name: 'Flexible Basic Authentication',
      confidence: 0.80,
      pattern: [
        {
          headerPattern: {
            'authorization': /^Basic\s+[A-Za-z0-9+/=]+/
          },
          statusPattern: SUCCESS_STATUS_CODES.concat(ERROR_STATUS_CODES),
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        authHeader: matches[0]?.request.headers.find(h => 
          h.name.toLowerCase() === 'authorization'
        ),
        details: {
          decodedCredentials: atob(matches[0]?.request.headers.find(h => h.name.toLowerCase() === 'authorization')?.value.split(' ')[1] || '')
        }
      }),
      tokenPatterns: [
        { name: 'credentials', pattern: /^Basic\s+([A-Za-z0-9+/=]+)/, location: 'header' }
      ]
    });
    
    // API Key Authentication
    this.patterns.set(AuthenticationPatternId.API_KEY_AUTH, {
      id: AuthenticationPatternId.API_KEY_AUTH,
      name: 'Flexible API Key Authentication',
      confidence: 0.82,
      pattern: [
        {
          headerPattern: {
            'x-api-key': /.+/,
            'authorization': /^Bearer\s+[A-Za-z0-9._-]+/
          },
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        apiKeyHeader: matches[0]?.request.headers.find(h => 
          h.name.toLowerCase() === 'x-api-key'
        ),
        details: {
          headers: matches[0]?.request.headers
        }
      }),
      tokenPatterns: [
        { name: 'api_key', pattern: /x-api-key:\s*([^\s]+)/i, location: 'header' }
      ]
    });
    
    // Bearer Token Authentication
    this.patterns.set(AuthenticationPatternId.BEARER_TOKEN_AUTH, {
      id: AuthenticationPatternId.BEARER_TOKEN_AUTH,
      name: 'Flexible Bearer Token Authentication',
      confidence: 0.83,
      pattern: [
        {
          headerPattern: {
            'authorization': /^Bearer\s+[A-Za-z0-9._-]+/
          },
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        authHeader: matches[0]?.request.headers.find(h => 
          h.name.toLowerCase() === 'authorization'
        ),
        details: {
          token: matches[0]?.request.headers.find(h => h.name.toLowerCase() === 'authorization')?.value.split(' ')[1]
        }
      }),
      tokenPatterns: [
        { name: 'access_token', pattern: /Bearer\s+([A-Za-z0-9._-]+)/, location: 'header' }
      ]
    });
    
    // Form-based Authentication without CSRF
    this.patterns.set(AuthenticationPatternId.FORM_AUTH_NO_CSRF, {
      id: AuthenticationPatternId.FORM_AUTH_NO_CSRF,
      name: 'Flexible Form-based Authentication (No CSRF)',
      confidence: 0.75,
      pattern: [
        {
          urlPattern: AUTH_ENDPOINT_PATTERNS,
          methodPattern: ['GET'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: AUTH_ENDPOINT_PATTERNS,
          methodPattern: ['POST', 'PUT'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        loginFormEndpoint: matches[0]?.request.url,
        authenticationEndpoint: matches[1]?.request.url,
        credentials: this.extractCredentials(matches[1]),
        details: {
          cookies: matches[1]?.response.headers.filter(h => h.name.toLowerCase() === 'set-cookie')
        }
      }),
      tokenPatterns: [
        { name: 'session_id', pattern: /set-cookie:\s*sessionid=([^;]+)/i, location: 'header' }
      ]
    });
    
    // Session Cookie Authentication
    this.patterns.set(AuthenticationPatternId.SESSION_COOKIE_AUTH, {
      id: AuthenticationPatternId.SESSION_COOKIE_AUTH,
      name: 'Flexible Session Cookie Authentication',
      confidence: 0.85,
      pattern: [
        {
          headerPattern: {
            'cookie': /sessionid=[^;]+|auth=[^;]+|token=[^;]+/i
          },
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        sessionId: this.extractSessionId(matches[0])
      }),
      tokenPatterns: [
        { name: 'session_id', pattern: /sessionid=([^;]+)/i, location: 'header' }
      ]
    });
    
    // MFA SMS Authentication
    this.patterns.set(AuthenticationPatternId.MFA_SMS, {
      id: AuthenticationPatternId.MFA_SMS,
      name: 'Flexible MFA (SMS)',
      confidence: 0.78,
      pattern: [
        {
          urlPattern: AUTH_ENDPOINT_PATTERNS,
          methodPattern: ['POST', 'PUT'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [
            /\/mfa\/sms/,
            /\/sms\/verify/,
            /\/2fa\/sms/
          ],
          methodPattern: ['GET', 'POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [
            /\/mfa\/verify/,
            /\/2fa\/verify/,
            /\/code\/verify/
          ],
          methodPattern: ['POST', 'PUT'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        loginEndpoint: matches[0]?.request.url,
        mfaSmsEndpoint: matches[1]?.request.url,
        verificationEndpoint: matches[2]?.request.url,
        details: {
          mfaToken: this.extractJwtToken(matches[1], 'mfa_token')
        }
      }),
      tokenPatterns: [
        { name: 'mfa_token', pattern: /"mfa_token":"([^"]+)"/, location: 'response' },
        { name: 'verification_code', pattern: /name="code" value="([^"]+)"/, location: 'response' }
      ]
    });
    
    // MFA TOTP Authentication
    this.patterns.set(AuthenticationPatternId.MFA_TOTP, {
      id: AuthenticationPatternId.MFA_TOTP,
      name: 'Flexible MFA (TOTP)',
      confidence: 0.80,
      pattern: [
        {
          urlPattern: AUTH_ENDPOINT_PATTERNS,
          methodPattern: ['POST', 'PUT'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [
            /\/mfa\/totp/,
            /\/totp\/verify/,
            /\/2fa\/totp/
          ],
          methodPattern: ['GET', 'POST'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        },
        {
          urlPattern: [
            /\/mfa\/verify/,
            /\/2fa\/verify/,
            /\/code\/verify/
          ],
          methodPattern: ['POST', 'PUT'],
          statusPattern: SUCCESS_STATUS_CODES,
          timing: FLEXIBLE_TIMING
        }
      ],
      extract: (matches) => ({
        loginEndpoint: matches[0]?.request.url,
        mfaTotpEndpoint: matches[1]?.request.url,
        verificationEndpoint: matches[2]?.request.url,
        details: {
          mfaToken: this.extractJwtToken(matches[1], 'mfa_token')
        }
      }),
      tokenPatterns: [
        { name: 'mfa_token', pattern: /"mfa_token":"([^"]+)"/, location: 'response' },
        { name: 'totp_code', pattern: /name="code" value="([^"]+)"/, location: 'response' }
      ]
    });
  }
  
  getAllPatterns(): Map<AuthenticationPatternId, AuthenticationPattern> {
    return this.patterns;
  }
  
  getPattern(id: AuthenticationPatternId): AuthenticationPattern | undefined {
    return this.patterns.get(id);
  }
  
  private extractOAuthState(matches: HarEntry[]): string | null {
    for (const match of matches) {
      try {
        const url = new URL(match.request.url);
        const stateParam = url.searchParams.get('state');
        if (stateParam) return stateParam;
      } catch (e) {
        // Invalid URL
      }
    }
    return null;
  }
  
  private extractCredentials(entry: HarEntry): Record<string, string> | null {
    if (!entry.request.postData?.text) return null;
    
    try {
      // Try JSON
      const data = JSON.parse(entry.request.postData.text);
      return {
        username: data.username || data.email || '',
        password: data.password || ''
      };
    } catch (e) {
      // Not JSON, try form data
      const formData = new URLSearchParams(entry.request.postData.text);
      return {
        username: formData.get('username') || formData.get('email') || '',
        password: formData.get('password') || ''
      };
    }
  }
  
  private extractJwtToken(entry: HarEntry, tokenType: string): string | null {
    if (!entry.response.content?.text) return null;
    
    try {
      const data = JSON.parse(entry.response.content.text);
      return data[tokenType] || null;
    } catch (e) {
      return null;
    }
  }
  
  private extractSamlResponse(entry: HarEntry): string | null {
    if (!entry.request.postData?.text) return null;
    
    try {
      const formData = new URLSearchParams(entry.request.postData.text);
      return formData.get('SAMLResponse') || null;
    } catch (e) {
      return null;
    }
  }
  
  private extractSessionId(entry: HarEntry): string | null {
    const cookieHeader = entry.request.headers.find(h => 
      h.name.toLowerCase() === 'cookie'
    );
    
    if (!cookieHeader) return null;
    
    const sessionIdMatch = cookieHeader.value.match(/sessionid=([^;]+)/);
    return sessionIdMatch ? sessionIdMatch[1] : null;
  }
}
