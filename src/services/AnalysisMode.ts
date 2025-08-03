// src/services/AnalysisMode.ts

// Namespace for all analysis-related types and configurations
export namespace AnalysisMode {
    export enum Predefined {
        AUTOMATIC = 'AUTOMATIC',
        ASSISTED = 'ASSISTED',
        MANUAL = 'MANUAL',
    }

    export enum ResourceType {
        AUTHENTICATION = 'AUTHENTICATION',
        API_ENDPOINT = 'API_ENDPOINT',
        FORM_SUBMISSION = 'FORM_SUBMISSION',
        GRAPHQL = 'GRAPHQL',
        REST_API = 'REST_API',
        HTML_DOCUMENT = 'HTML_DOCUMENT',
        FILE_UPLOAD = 'FILE_UPLOAD',
        WEBSOCKET = 'WEBSOCKET',
        THIRD_PARTY = 'THIRD_PARTY',
        TRACKING = 'TRACKING',
        STATIC_ASSET = 'STATIC_ASSET',
    }

    export enum TokenDetectionScope {
        COMPREHENSIVE_SCAN = 'COMPREHENSIVE_SCAN',
        SESSION_MANAGEMENT_FOCUSED = 'SESSION_MANAGEMENT_FOCUSED',
        USER_CONFIGURED = 'USER_CONFIGURED',
    }

    export enum CodeTemplateType {
        MULTI_STEP_FLOW_TEMPLATE = 'MULTI_STEP_FLOW_TEMPLATE',
        GENERIC_TEMPLATE = 'GENERIC_TEMPLATE',
        AUTHENTICATION_SUCCESS_TEMPLATE = 'AUTHENTICATION_SUCCESS_TEMPLATE',
    }

    export enum ParameterType {
        STRING = "STRING",
        NUMBER = "NUMBER",
        BOOLEAN = "BOOLEAN",
        OBJECT = "OBJECT",
        ARRAY = "ARRAY",
        JWT = "JWT",
        API_KEY = "API_KEY",
        SESSION_ID = "SESSION_ID",
        OAUTH_TOKEN = "OAUTH_TOKEN"
    }

    export interface EndpointCharacteristics {
        hasAuthentication: boolean;
        hasStateChange: boolean;
        hasDataSubmission: boolean;
        hasSensitiveData: boolean;
        isIdempotent: boolean;
        httpMethods: string[];
        parameterTypes: ParameterType[];
    }

    export interface RequestPattern {
        urlPattern?: RegExp;
        methodPattern?: string[];
        statusPattern?: number[];
        headerPattern?: Record<string, RegExp>;
        bodyPattern?: RegExp;
    }

    export type ExtractedData = Record<string, any>;

    export interface BehavioralPattern {
        name: string;
        significance: number; // 0-1
        pattern: RequestPattern[];
        extract: (matches: any[]) => ExtractedData;
    }

    export interface ContextualFilterRule {
        name: string;
        condition: (entry: any, context: any) => boolean;
        weight: number; // 0-1
    }

    export interface Configuration {
        mode: Predefined;
        filtering: {
            endpointPatterns: {
                include: RegExp[];
                exclude: RegExp[];
                priorityPatterns: { pattern: RegExp; weight: number }[];
            };
            resourceTypeWeights: Map<ResourceType, number>;
            contextualRules: ContextualFilterRule[];
            behavioralPatterns: BehavioralPattern[];
            scoreThresholds: {
                minimum: number;
                optimal: number;
                includeThreshold: number;
            };
        };
        tokenDetection: {
            scope: TokenDetectionScope;
            customPatterns?: RegExp[];
        };
        codeGeneration: {
            template: CodeTemplateType;
            includeComments: boolean;
        };
    }

    export interface EndpointClassifier {
        classifyEndpoint(request: any): ResourceType[];
        getEndpointCharacteristics(url: string): EndpointCharacteristics;
    }
}


// Helper function for OAuth pattern extraction
function extractOAuthState(matches: any[]): string | null {
  for (const match of matches) {
    if (match?.request?.url) {
      try {
        const stateParam = new URL(match.request.url).searchParams.get('state');
        if (stateParam) return stateParam;
      } catch (e) {
        console.warn("Invalid URL encountered while extracting OAuth state:", match.request.url);
      }
    }
  }
  return null;
}

// Default behavioral patterns
export const DEFAULT_BEHAVIORAL_PATTERNS: AnalysisMode.BehavioralPattern[] = [
  {
    name: 'oauth_flow',
    significance: 0.95,
    pattern: [
      { urlPattern: /\/authorize/, methodPattern: ['GET'] },
      { urlPattern: /\/callback/, statusPattern: [302, 303] },
      { urlPattern: /\/token/, methodPattern: ['POST'] }
    ],
    extract: (matches) => ({
      authorizationEndpoint: matches[0]?.request?.url,
      callbackEndpoint: matches[1]?.request?.url,
      tokenEndpoint: matches[2]?.request?.url,
      state: extractOAuthState(matches)
    })
  },
  {
    name: 'form_based_login',
    significance: 0.9,
    pattern: [
      { urlPattern: /\/(login|signin)/, methodPattern: ['GET'], statusPattern: [200] },
      { urlPattern: /\/(login|signin|authenticate)/, methodPattern: ['POST'] }
    ],
    extract: (matches) => ({
      loginFormEndpoint: matches[0]?.request?.url,
      authenticationEndpoint: matches[1]?.request?.url,
      credentials: matches[1]?.request?.postData
    })
  },
  {
    name: 'api_key_auth',
    significance: 0.85,
    pattern: [
      {
        headerPattern: {
          'x-api-key': /.+/,
          'authorization': /^(Bearer|APIKey)\s+.+/
        }
      }
    ],
    extract: (matches) => {
        const match = matches[0];
        if (!match || !match.request || !Array.isArray(match.request.headers)) {
            return {};
        }

        const authHeader = match.request.headers.find(h =>
            h.name.toLowerCase() === 'authorization'
        );
        const apiKeyHeader = match.request.headers.find(h =>
            h.name.toLowerCase() === 'x-api-key'
        );

        let authMethod = 'Unknown';
        if (authHeader && /^(Bearer|APIKey)/.test(authHeader.value)) {
            authMethod = authHeader.value.split(' ')[0];
        } else if (apiKeyHeader) {
            authMethod = 'APIKey';
        }

        return {
            apiEndpoint: match.request.url,
            authMethod: authMethod
        };
    }
  }
];

// Default contextual rules
export const DEFAULT_CONTEXTUAL_RULES: AnalysisMode.ContextualFilterRule[] = [
  {
    name: 'post_authentication_requests',
    condition: (entry, ctx) => {
      if (!ctx || !ctx.sessionState || !ctx.previousRequests) return false;
      const authCompleted = ctx.previousRequests.some(r =>
        r.request.url.includes('/login') &&
        r.response.status >= 200 &&
        r.response.status < 400
      );
      return authCompleted && ctx.sessionState.authTimestamp && entry.startedDateTime > ctx.sessionState.authTimestamp;
    },
    weight: 0.8
  },
  {
    name: 'form_submission_sequence',
    condition: (entry, ctx) => {
      if (!ctx || !ctx.previousRequests) return false;
      const hasFormView = ctx.previousRequests.some(r =>
        r.response.content?.mimeType?.includes('text/html') &&
        r.response.content?.text?.includes('<form')
      );
      return hasFormView && entry.request.method === 'POST';
    },
    weight: 0.9
  },
  {
    name: 'session_establishment',
    condition: (entry, ctx) => {
      if (!ctx || !ctx.sessionState) return false;
      const hasSetCookie = entry.response.headers.some(h =>
        h.name.toLowerCase() === 'set-cookie' &&
        (h.value.includes('session') || h.value.includes('auth'))
      );
      return hasSetCookie && !ctx.sessionState.isAuthenticated;
    },
    weight: 0.85
  }
];

// Initialize default configurations
export class AnalysisModeRegistry {
  private static configurations: Map<AnalysisMode.Predefined, AnalysisMode.Configuration> = new Map();

  static {
    // Automatic mode - intelligent detection
    this.register(AnalysisMode.Predefined.AUTOMATIC, {
      mode: AnalysisMode.Predefined.AUTOMATIC,
      filtering: {
        endpointPatterns: {
          include: [
            /\/(api|v\d+)\//,  // API endpoints
            /\/(auth|login|signin|signup|register)/i,  // Auth endpoints
            /\/(user|account|profile)/i,  // User management
            /\.(json|xml)$/i  // Data endpoints
          ],
          exclude: [
            /\.(css|js|png|jpg|gif|ico|woff2?|ttf|eot|svg)$/i,  // Static assets
            /\/(cdn|static|assets|images)\//i,  // Asset directories
            /\/(tracking|analytics|metrics)/i  // Analytics
          ],
          priorityPatterns: [
            { pattern: /\/login|\/authenticate/i, weight: 0.95 },
            { pattern: /\/api\/v\d+\/(auth|token)/i, weight: 0.9 },
            { pattern: /\/graphql/i, weight: 0.85 },
            { pattern: /\/(submit|create|update|delete)/i, weight: 0.8 }
          ]
        },
        resourceTypeWeights: new Map([
          [AnalysisMode.ResourceType.AUTHENTICATION, 1.0],
          [AnalysisMode.ResourceType.API_ENDPOINT, 0.9],
          [AnalysisMode.ResourceType.FORM_SUBMISSION, 0.85],
          [AnalysisMode.ResourceType.GRAPHQL, 0.8],
          [AnalysisMode.ResourceType.REST_API, 0.75],
          [AnalysisMode.ResourceType.HTML_DOCUMENT, 0.6],
          [AnalysisMode.ResourceType.FILE_UPLOAD, 0.7],
          [AnalysisMode.ResourceType.WEBSOCKET, 0.65],
          [AnalysisMode.ResourceType.THIRD_PARTY, 0.3],
          [AnalysisMode.ResourceType.TRACKING, 0.1],
          [AnalysisMode.ResourceType.STATIC_ASSET, 0.05]
        ]),
        contextualRules: DEFAULT_CONTEXTUAL_RULES,
        behavioralPatterns: DEFAULT_BEHAVIORAL_PATTERNS,
        scoreThresholds: {
          minimum: 0.3,
          optimal: 0.7,
          includeThreshold: 0.5
        }
      },
      tokenDetection: {
        scope: AnalysisMode.TokenDetectionScope.COMPREHENSIVE_SCAN,
        customPatterns: [
          /csrf[_-]?token/i,
          /x[_-]?csrf[_-]?token/i,
          /authenticity[_-]?token/i,
          /session[_-]?id/i,
          /jwt/i,
          /bearer\s+[\w-]+\.[\w-]+\.[\w-]+/i  // JWT pattern
        ]
      },
      codeGeneration: {
        template: AnalysisMode.CodeTemplateType.MULTI_STEP_FLOW_TEMPLATE,
        includeComments: true
      }
    });

    // Manual mode - user-driven selection
    this.register(AnalysisMode.Predefined.MANUAL, {
      mode: AnalysisMode.Predefined.MANUAL,
      filtering: {
        endpointPatterns: {
          include: [/.*/],  // Include everything
          exclude: [],      // Exclude nothing
          priorityPatterns: []  // No automatic prioritization
        },
        resourceTypeWeights: new Map([
          // Equal weights for manual selection
          ...Object.values(AnalysisMode.ResourceType).map(type =>
            [type, 0.5] as [AnalysisMode.ResourceType, number]
          )
        ]),
        contextualRules: [],  // No automatic rules
        behavioralPatterns: [],  // No pattern matching
        scoreThresholds: {
          minimum: 0,
          optimal: 1,
          includeThreshold: 0  // Include everything
        }
      },
      tokenDetection: {
        scope: AnalysisMode.TokenDetectionScope.USER_CONFIGURED
      },
      codeGeneration: {
        template: AnalysisMode.CodeTemplateType.GENERIC_TEMPLATE,
        includeComments: true
      }
    });

    // Assisted mode - balanced approach
    this.register(AnalysisMode.Predefined.ASSISTED, {
      mode: AnalysisMode.Predefined.ASSISTED,
      filtering: {
        endpointPatterns: {
          include: [
            /\/(api|v\d+)\//,
            /\/(auth|login|signin)/i,
            /\.(json|xml)$/i
          ],
          exclude: [
            /\.(css|js|png|jpg|gif|ico|woff2?)$/i,
            /\/(tracking|analytics)/i
          ],
          priorityPatterns: [
            { pattern: /\/login/i, weight: 0.9 },
            { pattern: /\/api\//i, weight: 0.8 }
          ]
        },
        resourceTypeWeights: new Map([
          [AnalysisMode.ResourceType.AUTHENTICATION, 0.9],
          [AnalysisMode.ResourceType.API_ENDPOINT, 0.8],
          [AnalysisMode.ResourceType.FORM_SUBMISSION, 0.7],
          [AnalysisMode.ResourceType.HTML_DOCUMENT, 0.5],
          [AnalysisMode.ResourceType.STATIC_ASSET, 0.2],
          [AnalysisMode.ResourceType.THIRD_PARTY, 0.3],
          [AnalysisMode.ResourceType.TRACKING, 0.1]
        ]),
        contextualRules: DEFAULT_CONTEXTUAL_RULES.slice(0, 2),  // Subset of rules
        behavioralPatterns: DEFAULT_BEHAVIORAL_PATTERNS.filter(p =>
          ['form_based_login', 'api_key_auth'].includes(p.name)
        ),
        scoreThresholds: {
          minimum: 0.4,
          optimal: 0.7,
          includeThreshold: 0.4
        }
      },
      tokenDetection: {
        scope: AnalysisMode.TokenDetectionScope.SESSION_MANAGEMENT_FOCUSED,
        customPatterns: [
          /csrf[_-]?token/i,
          /session[_-]?id/i
        ]
      },
      codeGeneration: {
        template: AnalysisMode.CodeTemplateType.AUTHENTICATION_SUCCESS_TEMPLATE,
        includeComments: true
      }
    });
  }

  static register(mode: AnalysisMode.Predefined, config: AnalysisMode.Configuration): void {
    this.configurations.set(mode, config);
  }

  static getConfiguration(mode: AnalysisMode.Predefined): AnalysisMode.Configuration {
    const config = this.configurations.get(mode);
    if (!config) {
      throw new Error(`Configuration for mode ${mode} not found.`);
    }
    return config;
  }

  static updateConfiguration(
    mode: AnalysisMode.Predefined,
    updates: Partial<AnalysisMode.Configuration>
  ): void {
    const existing = this.getConfiguration(mode);
    const updated = this.deepMerge(existing, updates);
    this.configurations.set(mode, updated);
  }

  private static deepMerge(
    target: any,
    source: any
  ): AnalysisMode.Configuration {
      const output = { ...target };
      if (this.isObject(target) && this.isObject(source)) {
          Object.keys(source).forEach(key => {
              if (this.isObject(source[key])) {
                  if (!(key in target))
                      Object.assign(output, { [key]: source[key] });
                  else
                      output[key] = this.deepMerge(target[key], source[key]);
              } else {
                  Object.assign(output, { [key]: source[key] });
              }
          });
      }
      return output;
  }

  private static isObject(item: any): boolean {
      return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

// Endpoint classifier implementation
export class EndpointClassifierImpl implements AnalysisMode.EndpointClassifier {
  classifyEndpoint(entry: any): AnalysisMode.ResourceType[] {
    const types: AnalysisMode.ResourceType[] = [];
    const { request, response } = entry;
    const url = request.url;
    const method = request.method;
    const reqContentType = request.headers?.find(h =>
      h.name.toLowerCase() === 'content-type'
    )?.value || '';
    const resContentType = response.content?.mimeType || '';


    // Authentication detection
    if (/(login|signin|auth|token|session)/i.test(url)) {
      types.push(AnalysisMode.ResourceType.AUTHENTICATION);
    }

    // API endpoint detection
    if (/\/(api|v\d+)\//i.test(url) || resContentType.includes('application/json')) {
      types.push(AnalysisMode.ResourceType.API_ENDPOINT);
    }

    // GraphQL detection
    if (/\/graphql/i.test(url) || request.postData?.text?.includes('query')) {
      types.push(AnalysisMode.ResourceType.GRAPHQL);
    }

    // Form submission detection
    if (method === 'POST' && reqContentType.includes('application/x-www-form-urlencoded')) {
      types.push(AnalysisMode.ResourceType.FORM_SUBMISSION);
    }

    // File upload detection
    if (reqContentType.includes('multipart/form-data')) {
      types.push(AnalysisMode.ResourceType.FILE_UPLOAD);
    }

    // WebSocket detection
    const upgradeHeader = request.headers?.find(h =>
      h.name.toLowerCase() === 'upgrade'
    );
    if (upgradeHeader?.value === 'websocket') {
      types.push(AnalysisMode.ResourceType.WEBSOCKET);
    }

    // Static asset detection
    if (/\.(css|js|png|jpg|gif|ico|woff2?|ttf|eot|svg)$/i.test(url)) {
      types.push(AnalysisMode.ResourceType.STATIC_ASSET);
    }

    // Third-party detection
    try {
        const requestDomain = new URL(url).hostname;
        // This is a placeholder. In a real scenario, you'd compare against the app's own domain.
        if (this.isThirdPartyDomain(requestDomain, "your-app-domain.com")) {
          types.push(AnalysisMode.ResourceType.THIRD_PARTY);
        }
    } catch(e) {
        console.warn("Could not parse URL to check for third-party domain:", url);
    }


    // Default to HTML document if no other type detected
    if (types.length === 0 && method === 'GET' && resContentType.includes('text/html')) {
      types.push(AnalysisMode.ResourceType.HTML_DOCUMENT);
    }
    
    // Fallback for REST
    if (types.includes(AnalysisMode.ResourceType.API_ENDPOINT) && !types.includes(AnalysisMode.ResourceType.GRAPHQL)) {
        types.push(AnalysisMode.ResourceType.REST_API);
    }

    return [...new Set(types)]; // Return unique types
  }

  getEndpointCharacteristics(url: string): AnalysisMode.EndpointCharacteristics {
    return {
      hasAuthentication: /(login|auth|session|token)/i.test(url),
      hasStateChange: /(create|update|delete|submit|save)/i.test(url),
      hasDataSubmission: /(submit|create|post|send)/i.test(url),
      hasSensitiveData: /(password|secret|key|token|credit)/i.test(url),
      isIdempotent: !/(create|update|delete|submit)/i.test(url),
      httpMethods: ['GET', 'POST', 'PUT', 'DELETE'], // This is a simplification.
      parameterTypes: this.detectParameterTypes(url)
    };
  }

  private isThirdPartyDomain(domain: string, appDomain: string): boolean {
    if (domain === appDomain) return false;
    // Simple check, can be improved with a proper suffix list
    return !domain.endsWith(appDomain);
  }

  private detectParameterTypes(url: string): AnalysisMode.ParameterType[] {
    const types: AnalysisMode.ParameterType[] = [];
    try {
        const params = new URL(url).searchParams;
        params.forEach((value, key) => {
          if (/token|jwt/i.test(key)) types.push(AnalysisMode.ParameterType.JWT);
          if (/key|apikey/i.test(key)) types.push(AnalysisMode.ParameterType.API_KEY);
          if (/^\d+$/.test(value)) types.push(AnalysisMode.ParameterType.NUMBER);
          if (/^(true|false)$/i.test(value)) types.push(AnalysisMode.ParameterType.BOOLEAN);
        });
    } catch(e) {
        console.warn("Could not parse URL to detect parameter types:", url);
    }


    return [...new Set(types)];
  }
}
