// src/services/AnalysisMode.ts

// --- Inferred Type Definitions for Analysis Configuration ---
// These types are based on the context provided in AnalysisModeConfiguration.

enum ScoringStrategyType {
  GET_REQUEST_OPTIMIZATION = 'get_request_optimization',
  FAILED_AUTH_OPTIMIZATION = 'failed_auth_optimization',
  SUCCESS_FLOW_OPTIMIZATION = 'success_flow_optimization',
  COMPREHENSIVE_WEIGHTED = 'comprehensive_weighted',
  CUSTOM_USER_DEFINED = 'custom_user_defined',
}

export enum DomainStrictnessLevel {
  EXACT_MATCH = 'exact_match',
  SAME_SUBDOMAIN = 'same_subdomain',
  ANY_SUBDOMAIN = 'any_subdomain',
}

interface FilteringCriteria {
  includeStaticResources?: boolean;
  prioritizeHTMLResponses?: boolean;
  excludeXHRRequests?: boolean;
  domainStrictness?: DomainStrictnessLevel;
  prioritizeErrorResponses?: boolean;
  includeRedirectChains?: boolean;
  statusCodeFiltering?: number[];
  prioritizeSuccessResponses?: boolean;
  includeSessionEstablishment?: boolean;
  customFilterLogic?: string;
}

enum TokenDetectionScope {
  FORM_BASED_ONLY = 'form_based_only',
  COMPREHENSIVE_SCAN = 'comprehensive_scan',
  SESSION_MANAGEMENT_FOCUSED = 'session_management_focused',
  USER_CONFIGURED = 'user_configured',
}

enum CodeTemplateType {
  SINGLE_REQUEST_TEMPLATE = 'single_request_template',
  AUTHENTICATION_FAILURE_TEMPLATE = 'authentication_failure_template',
  AUTHENTICATION_SUCCESS_TEMPLATE = 'authentication_success_template',
  MULTI_STEP_FLOW_TEMPLATE = 'multi_step_flow_template',
  GENERIC_TEMPLATE = 'generic_template',
}

export enum ValidationRuleSet {
  MINIMAL_VALIDATION = 'minimal_validation',
  FAILURE_PATTERN_VALIDATION = 'failure_pattern_validation',
  SUCCESS_PATTERN_VALIDATION = 'success_pattern_validation',
  COMPREHENSIVE_VALIDATION = 'comprehensive_validation',
  USER_DEFINED_RULES = 'user_defined_rules',
}

enum PerformanceProfile {
  LOW_LATENCY = 'low_latency',
  ACCURACY_OPTIMIZED = 'accuracy_optimized',
  COMPREHENSIVE_ANALYSIS = 'comprehensive_analysis',
  BALANCED = 'balanced',
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// --- Main Analysis Mode Logic ---

export enum AnalysisMode {
  INITIAL_PAGE_LOAD = 'initial_page_load',
  FAILED_AUTHENTICATION = 'failed_authentication',
  SUCCESSFUL_AUTHENTICATION = 'successful_authentication',
  COMPREHENSIVE_FLOW = 'comprehensive_flow',
  CUSTOM_PATTERN = 'custom_pattern'
}

export interface AnalysisModeConfiguration {
  mode: AnalysisMode;
  scoringStrategy: ScoringStrategyType;
  filteringCriteria: FilteringCriteria;
  tokenDetectionScope: TokenDetectionScope;
  codeGenerationTemplate: CodeTemplateType;
  validationRules: ValidationRuleSet;
  performanceProfile: PerformanceProfile;
}

export class AnalysisModeRegistry {
  private static readonly MODE_CONFIGURATIONS: Map<AnalysisMode, AnalysisModeConfiguration> = new Map([
    // Existing Configurations
    [AnalysisMode.INITIAL_PAGE_LOAD, {
      mode: AnalysisMode.INITIAL_PAGE_LOAD,
      scoringStrategy: ScoringStrategyType.GET_REQUEST_OPTIMIZATION,
      filteringCriteria: {
        includeStaticResources: false,
        prioritizeHTMLResponses: true,
        excludeXHRRequests: true,
        domainStrictness: DomainStrictnessLevel.EXACT_MATCH
      },
      tokenDetectionScope: TokenDetectionScope.FORM_BASED_ONLY,
      codeGenerationTemplate: CodeTemplateType.SINGLE_REQUEST_TEMPLATE,
      validationRules: ValidationRuleSet.MINIMAL_VALIDATION,
      performanceProfile: PerformanceProfile.LOW_LATENCY
    }],

    [AnalysisMode.FAILED_AUTHENTICATION, {
      mode: AnalysisMode.FAILED_AUTHENTICATION,
      scoringStrategy: ScoringStrategyType.FAILED_AUTH_OPTIMIZATION,
      filteringCriteria: {
        includeStaticResources: false,
        prioritizeErrorResponses: true,
        includeRedirectChains: true,
        statusCodeFiltering: [400, 401, 403, 422, 429]
      },
      tokenDetectionScope: TokenDetectionScope.COMPREHENSIVE_SCAN,
      codeGenerationTemplate: CodeTemplateType.AUTHENTICATION_FAILURE_TEMPLATE,
      validationRules: ValidationRuleSet.FAILURE_PATTERN_VALIDATION,
      performanceProfile: PerformanceProfile.ACCURACY_OPTIMIZED
    }],

    [AnalysisMode.SUCCESSFUL_AUTHENTICATION, {
      mode: AnalysisMode.SUCCESSFUL_AUTHENTICATION,
      scoringStrategy: ScoringStrategyType.SUCCESS_FLOW_OPTIMIZATION,
      filteringCriteria: {
        includeStaticResources: false,
        prioritizeSuccessResponses: true,
        includeSessionEstablishment: true,
        statusCodeFiltering: [200, 201, 302, 303]
      },
      tokenDetectionScope: TokenDetectionScope.SESSION_MANAGEMENT_FOCUSED,
      codeGenerationTemplate: CodeTemplateType.AUTHENTICATION_SUCCESS_TEMPLATE,
      validationRules: ValidationRuleSet.SUCCESS_PATTERN_VALIDATION,
      performanceProfile: PerformanceProfile.COMPREHENSIVE_ANALYSIS
    }],

    // --- New Configurations ---
    [AnalysisMode.COMPREHENSIVE_FLOW, {
        mode: AnalysisMode.COMPREHENSIVE_FLOW,
        scoringStrategy: ScoringStrategyType.COMPREHENSIVE_WEIGHTED,
        filteringCriteria: {
          includeStaticResources: true,
          includeRedirectChains: true,
          domainStrictness: DomainStrictnessLevel.SAME_SUBDOMAIN,
        },
        tokenDetectionScope: TokenDetectionScope.COMPREHENSIVE_SCAN,
        codeGenerationTemplate: CodeTemplateType.MULTI_STEP_FLOW_TEMPLATE,
        validationRules: ValidationRuleSet.COMPREHENSIVE_VALIDATION,
        performanceProfile: PerformanceProfile.COMPREHENSIVE_ANALIYsis
      }],
  
      [AnalysisMode.CUSTOM_PATTERN, {
        mode: AnalysisMode.CUSTOM_PATTERN,
        scoringStrategy: ScoringStrategyType.CUSTOM_USER_DEFINED,
        filteringCriteria: {
          customFilterLogic: "/* User-defined filter logic goes here */"
        },
        tokenDetectionScope: TokenDetectionScope.USER_CONFIGURED,
        codeGenerationTemplate: CodeTemplateType.GENERIC_TEMPLATE,
        validationRules: ValidationRuleSet.USER_DEFINED_RULES,
        performanceProfile: PerformanceProfile.BALANCED
      }]
  ]);

  static getConfiguration(mode: AnalysisMode): AnalysisModeConfiguration {
    const configuration = this.MODE_CONFIGURATIONS.get(mode);
    if (!configuration) {
      throw new ConfigurationError(`Unsupported analysis mode: ${mode}`);
    }
    return configuration;
  }
}
