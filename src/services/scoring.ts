// src/services/scoring.ts
import { AnalysisMode } from './AnalysisMode';
import { HarEntry } from './TokenDetector';

// --- Interfaces and Types ---

export interface ScoringMetadata {
  methodScore?: number;
  contentTypeScore?: number;
  urlSemanticScore?: number;
  temporalScore?: number;
  complexityScore?: number;
  statusScore?: number;
  contentAnalysisScore?: number;
  payloadScore?: number;
  retryPatternScore?: number;
}

export interface ScoredEntry extends HarEntry {
  score: number;
  scoringMetadata: ScoringMetadata;
  analysisMode: AnalysisMode;
  confidence: number;
}

export interface AnalysisContext {
  allEntries: HarEntry[];
  currentIndex: number;
  targetUrl: string;
}

export interface ScoringWeightMatrix {
  httpMethod: { [key: string]: number };
  responseContentType: { [key: string]: number };
  urlSemanticAnalysis: { [key: string]: number };
  temporalPositioning: { [key: string]: number };
}

export interface FailureIndicatorMatrix {
  httpStatusCodes: { [key: number]: number };
  responseContentPatterns: { [key: string]: number };
  requestCharacteristics: { [key: string]: number };
}

export interface ScoringStrategyMetadata {
    name: string;
    description: string;
    supportedMode: AnalysisMode;
}

export interface ContextualScoringStrategy {
  computeScore(entry: HarEntry, context: AnalysisContext): Promise<ScoredEntry>;
  getStrategyMetadata(): ScoringStrategyMetadata;
}

// --- Analyzers (Inferred Implementations) ---

class SemanticURLAnalyzer {
  async extractFeatures(url: string): Promise<{
    isRootPath: boolean;
    isIndexPage: boolean;
    containsAuthKeywords: boolean;
    isStaticResource: boolean;
  }> {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.toLowerCase();
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    
    return {
      isRootPath: path === '/',
      isIndexPage: path.startsWith('/index.') || path === '/',
      containsAuthKeywords: /login|auth|signin|session|account/.test(path),
      isStaticResource: staticExtensions.some(ext => path.endsWith(ext)),
    };
  }
}

class FailurePatternDetector {
  async detectPatterns(content: string | undefined): Promise<{
    containsErrorMessages: boolean;
    containsValidationErrors: boolean;
    containsSecurityMeasures: boolean;
  }> {
    if (!content) return { containsErrorMessages: false, containsValidationErrors: false, containsSecurityMeasures: false };
    const lowerContent = content.toLowerCase();
    return {
      containsErrorMessages: /error|failed|incorrect|invalid|denied/.test(lowerContent),
      containsValidationErrors: /validation|please check|is required|must be a valid/.test(lowerContent),
      containsSecurityMeasures: /captcha|rate limit|too many requests|security check/.test(lowerContent),
    };
  }
}


// --- Scoring Strategy Implementations ---

class InitialPageLoadScoringStrategy implements ContextualScoringStrategy {
    private readonly weightingMatrix: ScoringWeightMatrix = {
        httpMethod: { GET: 15, POST: -5, OPTIONS: -10, HEAD: -8 },
        responseContentType: { 'text/html': 20, 'application/json': -5, 'text/css': -15, 'image/*': -20, 'application/javascript': -12 },
        urlSemanticAnalysis: { authenticationKeywords: -10, staticResourcePatterns: -25, apiEndpointPatterns: -8, mainNavigationPatterns: 12 },
        temporalPositioning: { firstRequestBonus: 25, earlyRequestBonus: 10, lateRequestPenalty: -5 }
    };

    getStrategyMetadata(): ScoringStrategyMetadata {
        return { name: "Initial Page Load", description: "Scores entries based on initial page load characteristics.", supportedMode: AnalysisMode.INITIAL_PAGE_LOAD };
    }

    async computeScore(entry: HarEntry, context: AnalysisContext): Promise<ScoredEntry> {
        let compositeScore = 0;
        const scoringMetadata: ScoringMetadata = {};

        compositeScore += this.weightingMatrix.httpMethod[entry.request.method] || 0;
        scoringMetadata.methodScore = this.weightingMatrix.httpMethod[entry.request.method];

        const contentType = entry.response.content.mimeType.toLowerCase();
        const contentTypeScore = this.computeContentTypeScore(contentType);
        compositeScore += contentTypeScore;
        scoringMetadata.contentTypeScore = contentTypeScore;

        const urlSemanticScore = await this.performUrlSemanticAnalysis(entry.request.url);
        compositeScore += urlSemanticScore;
        scoringMetadata.urlSemanticScore = urlSemanticScore;
        
        const temporalScore = this.computeTemporalPositioning(context);
        compositeScore += temporalScore;
        scoringMetadata.temporalScore = temporalScore;

        return {
            ...entry,
            score: Math.max(0, compositeScore),
            scoringMetadata,
            analysisMode: AnalysisMode.INITIAL_PAGE_LOAD,
            confidence: this.calculateConfidence(scoringMetadata)
        };
    }
    
    private computeContentTypeScore(contentType: string): number {
        for (const key in this.weightingMatrix.responseContentType) {
            if (contentType.startsWith(key.replace('*', ''))) {
                return this.weightingMatrix.responseContentType[key];
            }
        }
        return 0;
    }

    private async performUrlSemanticAnalysis(url: string): Promise<number> {
        const urlAnalyzer = new SemanticURLAnalyzer();
        const semanticFeatures = await urlAnalyzer.extractFeatures(url);
        let semanticScore = 0;
        if (semanticFeatures.isRootPath || semanticFeatures.isIndexPage) semanticScore += 15;
        if (semanticFeatures.containsAuthKeywords) semanticScore -= 10;
        if (semanticFeatures.isStaticResource) semanticScore -= 25;
        return semanticScore;
    }
    
    private computeTemporalPositioning(context: AnalysisContext): number {
        const { currentIndex, allEntries } = context;
        if (currentIndex === 0) return this.weightingMatrix.temporalPositioning.firstRequestBonus;
        if (currentIndex < allEntries.length * 0.2) return this.weightingMatrix.temporalPositioning.earlyRequestBonus;
        if (currentIndex > allEntries.length * 0.8) return this.weightingMatrix.temporalPositioning.lateRequestPenalty;
        return 0;
    }
    
    private calculateConfidence(metadata: ScoringMetadata): number {
        return Math.random(); 
    }
}

class FailedAuthenticationScoringStrategy implements ContextualScoringStrategy {
    private readonly failureIndicatorWeights: FailureIndicatorMatrix = {
        httpStatusCodes: { 400: 20, 401: 25, 403: 22, 422: 18, 429: 15 },
        responseContentPatterns: { errorKeywords: 15, validationMessages: 12, captchaPresence: 10, rateLimitingIndicators: 18 },
        requestCharacteristics: { postDataPresence: 10, credentialFields: 15, tokenSubmission: 8 }
    };

    getStrategyMetadata(): ScoringStrategyMetadata {
        return { name: "Failed Authentication", description: "Scores entries based on failed authentication patterns.", supportedMode: AnalysisMode.FAILED_AUTHENTICATION };
    }

    async computeScore(entry: HarEntry, context: AnalysisContext): Promise<ScoredEntry> {
        let compositeScore = 0;
        const scoringMetadata: ScoringMetadata = {};

        const statusScore = this.failureIndicatorWeights.httpStatusCodes[entry.response.status] || 0;
        compositeScore += statusScore;
        scoringMetadata.statusScore = statusScore;

        const contentAnalysisScore = await this.analyzeFailureContent(entry.response.content.text);
        compositeScore += contentAnalysisScore;
        scoringMetadata.contentAnalysisScore = contentAnalysisScore;

        const payloadScore = this.analyzeCredentialSubmission(entry.request.postData?.text);
        compositeScore += payloadScore;
        scoringMetadata.payloadScore = payloadScore;

        return {
            ...entry,
            score: Math.max(0, compositeScore),
            scoringMetadata,
            analysisMode: AnalysisMode.FAILED_AUTHENTICATION,
            confidence: this.calculateConfidence(scoringMetadata)
        };
    }

    private async analyzeFailureContent(responseContent: string | undefined): Promise<number> {
        const failurePatternDetector = new FailurePatternDetector();
        const patterns = await failurePatternDetector.detectPatterns(responseContent);
        let contentScore = 0;
        if (patterns.containsErrorMessages) contentScore += this.failureIndicatorWeights.responseContentPatterns.errorKeywords;
        if (patterns.containsValidationErrors) contentScore += this.failureIndicatorWeights.responseContentPatterns.validationMessages;
        if (patterns.containsSecurityMeasures) contentScore += this.failureIndicatorWeights.responseContentPatterns.captchaPresence;
        return contentScore;
    }
    
    private analyzeCredentialSubmission(postData: string | undefined): number {
        if (!postData) return 0;
        let score = this.failureIndicatorWeights.requestCharacteristics.postDataPresence;
        if (/password|credential|secret/.test(postData)) {
            score += this.failureIndicatorWeights.requestCharacteristics.credentialFields;
        }
        return score;
    }
    
    private calculateConfidence(metadata: ScoringMetadata): number {
        return Math.random();
    }
}

// Placeholder Strategies
class SuccessfulAuthenticationScoringStrategy implements ContextualScoringStrategy {
    getStrategyMetadata(): ScoringStrategyMetadata { return { name: "Successful Authentication", description: "...", supportedMode: AnalysisMode.SUCCESSFUL_AUTHENTICATION }; }
    async computeScore(entry: HarEntry, context: AnalysisContext): Promise<ScoredEntry> {
        let score = 0;
        if (entry.response.status >= 200 && entry.response.status < 400) score += 20;
        if (entry.request.method === 'POST') score += 10;
        return { ...entry, score, scoringMetadata: {}, analysisMode: AnalysisMode.SUCCESSFUL_AUTHENTICATION, confidence: 0.5 };
    }
}
class ComprehensiveFlowScoringStrategy implements ContextualScoringStrategy {
    getStrategyMetadata(): ScoringStrategyMetadata { return { name: "Comprehensive Flow", description: "...", supportedMode: AnalysisMode.COMPREHENSIVE_FLOW }; }
    async computeScore(entry: HarEntry, context: AnalysisContext): Promise<ScoredEntry> {
        return { ...entry, score: 10, scoringMetadata: {}, analysisMode: AnalysisMode.COMPREHENSIVE_FLOW, confidence: 0.5 };
    }
}
class CustomPatternScoringStrategy implements ContextualScoringStrategy {
    getStrategyMetadata(): ScoringStrategyMetadata { return { name: "Custom Pattern", description: "...", supportedMode: AnalysisMode.CUSTOM_PATTERN }; }
    async computeScore(entry: HarEntry, context: AnalysisContext): Promise<ScoredEntry> {
        return { ...entry, score: 10, scoringMetadata: {}, analysisMode: AnalysisMode.CUSTOM_PATTERN, confidence: 0.5 };
    }
}


// --- Factory ---

export class ScoringStrategyFactory {
  static getStrategy(mode: AnalysisMode): ContextualScoringStrategy {
    switch (mode) {
      case AnalysisMode.INITIAL_PAGE_LOAD:
        return new InitialPageLoadScoringStrategy();
      case AnalysisMode.FAILED_AUTHENTICATION:
        return new FailedAuthenticationScoringStrategy();
      case AnalysisMode.SUCCESSFUL_AUTHENTICATION:
        return new SuccessfulAuthenticationScoringStrategy();
      case AnalysisMode.COMPREHENSIVE_FLOW:
        return new ComprehensiveFlowScoringStrategy();
      case AnalysisMode.CUSTOM_PATTERN:
        return new CustomPatternScoringStrategy();
      default:
        console.warn(`No specific scoring strategy for mode ${mode}, falling back to Comprehensive.`);
        return new ComprehensiveFlowScoringStrategy();
    }
  }
}
