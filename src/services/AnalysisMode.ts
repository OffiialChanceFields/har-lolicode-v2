// src/services/AnalysisMode.ts
import { HarRequest, HarEntry } from '../types';

export namespace AnalysisMode {
  // Predefined configuration profiles
  export enum Predefined {
    AUTOMATIC = 'automatic',
    MANUAL = 'manual',
    ASSISTED = 'assisted'
  }

  // Resource types for classification
  export enum ResourceType {
    AUTHENTICATION = 'authentication',
    API_ENDPOINT = 'api_endpoint',
    FORM_SUBMISSION = 'form_submission',
    GRAPHQL = 'graphql',
    REST_API = 'rest_api',
    HTML_DOCUMENT = 'html_document',
    FILE_UPLOAD = 'file_upload',
    WEBSOCKET = 'websocket',
    THIRD_PARTY = 'third_party',
    TRACKING = 'tracking',
    STATIC_ASSET = 'static_asset',
    SESSION_MANAGEMENT = 'session_management'
  }

  // Token detection scopes
  export enum TokenDetectionScope {
    COMPREHENSIVE_SCAN = 'comprehensive',
    SESSION_MANAGEMENT_FOCUSED = 'session_focused',
    USER_CONFIGURED = 'user_configured',
    MINIMAL = 'minimal'
  }

  // Code template types
  export enum CodeTemplateType {
    SINGLE_REQUEST_TEMPLATE = 'single_request',
    AUTHENTICATION_FAILURE_TEMPLATE = 'auth_failure',
    AUTHENTICATION_SUCCESS_TEMPLATE = 'auth_success',
    MULTI_STEP_FLOW_TEMPLATE = 'multi_step_flow',
    GENERIC_TEMPLATE = 'generic'
  }

  // Parameter types for endpoint analysis
  export enum ParameterType {
    JWT = 'jwt',
    API_KEY = 'api_key',
    OAUTH_STATE = 'oauth_state',
    SESSION_ID = 'session_id',
    USERNAME = 'username',
    PASSWORD = 'password',
    EMAIL = 'email',
    BOOLEAN = 'boolean',
    NUMBER = 'number',
    STRING = 'string'
  }

  // Endpoint characteristics
  export interface EndpointCharacteristics {
    hasAuthentication: boolean;
    hasStateChange: boolean;
    hasDataSubmission: boolean;
    hasSensitiveData: boolean;
    isIdempotent: boolean;
    httpMethods: string[];
    parameterTypes: ParameterType[];
  }

  // Filtering configuration
  export interface FilteringConfig {
    endpointPatterns: {
      include: RegExp[];
      exclude: RegExp[];
      priorityPatterns: {
        pattern: RegExp;
        weight: number;
      }[];
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

  // Token detection configuration
  export interface TokenDetectionConfig {
    scope: TokenDetectionScope;
    customPatterns?: RegExp[];
  }

  