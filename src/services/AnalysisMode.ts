
export namespace AnalysisMode {
  export enum Predefined {
    ASSISTED = 'assisted',
    AUTOMATIC = 'automatic',
    CUSTOM = 'custom',
    MANUAL = 'manual'
  }

  export enum ResourceType {
    API_ENDPOINT = 'api_endpoint',
    AUTHENTICATION = 'authentication',
    FORM_SUBMISSION = 'form_submission',
    HTML_DOCUMENT = 'html_document',
    STATIC_ASSET = 'static_asset',
    THIRD_PARTY = 'third_party'
  }

  export enum TokenDetectionScope {
    COMPREHENSIVE_SCAN = 'comprehensive_scan',
    TARGETED_ANALYSIS = 'targeted_analysis'
  }

  export enum CodeTemplateType {
    MULTI_STEP_FLOW_TEMPLATE = 'multi_step_flow_template',
    SINGLE_REQUEST_TEMPLATE = 'single_request_template'
  }

  export interface WeightPattern {
    pattern: RegExp;
    weight: number;
  }

  export interface FilteringOptions {
    endpointPatterns?: {
      include?: RegExp[];
      exclude?: RegExp[];
      priorityPatterns?: WeightPattern[];
    };
    resourceTypeWeights?: Map<ResourceType, number>;
  }

  export interface TokenDetectionOptions {
    scope: TokenDetectionScope;
    customPatterns?: RegExp[];
  }

  export interface CodeGenerationOptions {
    template: CodeTemplateType;
    includeComments: boolean;
  }

  export interface AnalysisConfig {
    mode: Predefined | string;
    filtering: FilteringOptions;
    tokenDetection: TokenDetectionOptions;
    codeGeneration: CodeGenerationOptions;
  }
}

export class AnalysisModeService {
  private modes: Map<string, AnalysisMode.AnalysisConfig> = new Map();

  constructor() {
    this.registerDefaultModes();
  }

  private registerDefaultModes(): void {
    // Manual mode - minimal automation
    this.register(AnalysisMode.Predefined.MANUAL, {
      mode: AnalysisMode.Predefined.MANUAL,
      filtering: {},
      tokenDetection: {
        scope: AnalysisMode.TokenDetectionScope.TARGETED_ANALYSIS
      },
      codeGeneration: {
        template: AnalysisMode.CodeTemplateType.SINGLE_REQUEST_TEMPLATE,
        includeComments: false
      }
    });

    // Automatic mode - aggressive automation
    this.register(AnalysisMode.Predefined.AUTOMATIC, {
      mode: AnalysisMode.Predefined.AUTOMATIC,
      filtering: {
        endpointPatterns: {
          include: [/.*/], // Include everything by default
          exclude: [
            /\.(css|js|png|jpg|gif|svg|ico|woff2?)$/i,
            /google-analytics\.com/,
            /doubleclick\.net/
          ],
          priorityPatterns: [
            { pattern: /login|auth|signin|token|oauth/i, weight: 1.0 },
            { pattern: /api/i, weight: 0.8 }
          ]
        },
        resourceTypeWeights: new Map([
          [AnalysisMode.ResourceType.AUTHENTICATION, 1.0],
          [AnalysisMode.ResourceType.API_ENDPOINT, 0.8],
          [AnalysisMode.ResourceType.FORM_SUBMISSION, 0.9],
          [AnalysisMode.ResourceType.HTML_DOCUMENT, 0.4],
          [AnalysisMode.ResourceType.STATIC_ASSET, 0.1],
          [AnalysisMode.ResourceType.THIRD_PARTY, 0.2]
        ])
      },
      tokenDetection: {
        scope: AnalysisMode.TokenDetectionScope.COMPREHENSIVE_SCAN,
        customPatterns: [
          /csrf[_-]?token/i,
          /x[_-]?csrf[_-]?token/i,
          /authenticity[_-]?token/i,
          /session[_-]?id/i,
          /jwt/i,
          /bearer\s+[\w-]+\.[\w-]+\.[\w-]+/i // JWT pattern
        ]
      },
      codeGeneration: {
        template: AnalysisMode.CodeTemplateType.MULTI_STEP_FLOW_TEMPLATE,
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
          [AnalysisMode.ResourceType.THIRD_PARTY, 0.3]
        ])
      },
      tokenDetection: {
        scope: AnalysisMode.TokenDetectionScope.COMPREHENSIVE_SCAN
      },
      codeGeneration: {
        template: AnalysisMode.CodeTemplateType.MULTI_STEP_FLOW_TEMPLATE,
        includeComments: true
      }
    });
  }

  register(name: string, config: AnalysisMode.AnalysisConfig): void {
    if (this.modes.has(name)) {
      console.warn(`Analysis mode "${name}" is being overridden.`);
    }
    this.modes.set(name, config);
  }

  get(name: string): AnalysisMode.AnalysisConfig | undefined {
    return this.modes.get(name);
  }

  list(): string[] {
    return Array.from(this.modes.keys());
  }

  createCustom(
    baseModeName: string,
    overrides: Partial<AnalysisMode.AnalysisConfig>
  ): AnalysisMode.AnalysisConfig {
    const baseConfig = this.get(baseModeName);
    if (!baseConfig) {
      throw new Error(`Base mode "${baseModeName}" not found.`);
    }

    // Deep merge would be better for a real implementation
    const customConfig = {
      ...baseConfig,
      ...overrides,
      mode: AnalysisMode.Predefined.CUSTOM
    };

    return customConfig;
  }
}
