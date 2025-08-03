
export namespace AnalysisMode {
  export enum Predefined {
    AUTOMATIC = 'automatic',
    MANUAL = 'manual',
    ASSISTED = 'assisted',
  }

  export enum DomainStrictnessLevel {
    SAME_ORIGIN_ONLY = 'same_origin_only',
    SAME_ETLD_PLUS_ONE = 'same_etld_plus_one',
    ANY = 'any',
  }

  export enum ResourceType {
    HTML_DOCUMENT = 'html_document',
    API_ENDPOINT = 'api_endpoint',
    AUTHENTICATION = 'authentication',
    FORM_SUBMISSION = 'form_submission',
    FILE_UPLOAD = 'file_upload',
    WEBSOCKET = 'websocket',
    GRAPHQL = 'graphql',
    REST_API = 'rest_api',
    STATIC_ASSET = 'static_asset',
    TRACKING = 'tracking',
    THIRD_PARTY = 'third_party'
  }

  export interface EndpointScore {
    relevanceScore: number;      // 0-100
    securityScore: number;       // 0-100  
    businessLogicScore: number;  // 0-100
    temporalScore: number;       // Based on request timing
    contextualScore: number;     // Based on surrounding requests
  }
  
  // --- New Behavioral Pattern Interfaces ---
  export interface TimingConstraint {
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
  }

  export interface RequestPattern {
    urlPattern?: RegExp;
    methodPattern?: string[];
    statusPattern?: number[];
    headerPattern?: Record<string, RegExp>;
    bodyPattern?: RegExp;
    timing?: TimingConstraint;
  }
  
  export type ExtractedData = Record<string, any>;

  export interface BehavioralPattern {
    name: string;
    pattern: RequestPattern[];
    significance: number; // 0-1
    extract: (matches: any[]) => ExtractedData;
  }
  // --- End New Interfaces ---
  
  export interface SessionState {
    authTimestamp?: number;
    isAuthenticated: boolean;
  }

  export interface TimeWindow {
      start: Date;
      end: Date;
  }

  export interface RequestContext {
    previousRequests: any[]; // Using any to avoid circular dependency with HarEntry
    subsequentRequests: any[];
    sessionState: SessionState;
    timeWindow: TimeWindow;
    referrerChain: string[];
  }

  export interface ContextualFilterRule {
    name: string;
    condition: (entry: any, context: RequestContext) => boolean;
    weight: number;
    metadata?: Record<string, any>;
  }

  export interface EnhancedFilteringCriteria {
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
  }

  export enum ParameterType {
    STRING,
    NUMBER,
    BOOLEAN,
    OBJECT,
    ARRAY,
    JWT,
    API_KEY
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

  export interface EndpointClassifier {
    classifyEndpoint(request: Request): ResourceType[];
    getEndpointCharacteristics(url: string): EndpointCharacteristics;
  }

  export enum TokenDetectionScope {
    FORM_BASED_ONLY = 'form_based_only',
    COMPREHENSIVE_SCAN = 'comprehensive_scan',
    SESSION_MANAGEMENT_FOCUSED = 'session_management_focused',
    USER_CONFIGURED = 'user_configured',
  }

  export enum CodeTemplateType {
    SINGLE_REQUEST_TEMPLATE = 'single_request_template',
    AUTHENTICATION_FAILURE_TEMPLATE = 'authentication_failure_template',
    AUTHENTICATION_SUCCESS_TEMPLATE = 'authentication_success_template',
    MULTI_STEP_FLOW_TEMPLATE = 'multi_step_flow_template',
    GENERIC_TEMPLATE = 'generic_template',
  }

  export interface Configuration {
    mode: Predefined;
    filtering: EnhancedFilteringCriteria;
    tokenDetection: {
      scope: TokenDetectionScope;
      customPatterns?: RegExp[];
    };
    codeGeneration: {
      template: CodeTemplateType;
      includeComments: boolean;
    };
  }
}
