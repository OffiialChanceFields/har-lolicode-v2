
import { AnalysisMode } from './AnalysisMode';
import { EndpointClassifierImpl } from './EndpointClassifierImpl';
import { HarEntry } from './types';

// --- Enhanced Interfaces and Types ---

export interface ScoredEntry extends HarEntry {
  score: {
    relevanceScore: number;
    securityScore: number;
    businessLogicScore: number;
    temporalScore: number;
    contextualScore: number;
  };
  finalScore: number;
  analysisMode: AnalysisMode.Predefined;
  confidence: number;
}

export interface AnalysisContext {
  allEntries: HarEntry[];
  currentIndex: number;
  criteria: AnalysisMode.FilteringConfig;
}

// --- Scoring Service ---

export class EndpointScoringService {
  private classifier = new EndpointClassifierImpl();

  public scoreEntry(entry: HarEntry, context: AnalysisContext): ScoredEntry {
    const { criteria } = context;
    const { request } = entry;
    
    const resourceTypes = this.classifier.classifyEndpoint(request);
    const characteristics = this.classifier.getEndpointCharacteristics(request.url);

    const score = {
      relevanceScore: this.calculateRelevanceScore(request.url, resourceTypes, criteria),
      securityScore: this.calculateSecurityScore(characteristics),
      businessLogicScore: this.calculateBusinessLogicScore(resourceTypes, characteristics),
      temporalScore: this.calculateTemporalScore(context.currentIndex, context.allEntries.length),
      contextualScore: this.calculateContextualScore(entry, context, criteria)
    };
    
    const finalScore = this.calculateFinalScore(score, criteria);
    const confidence = this.calculateConfidence(score);
    
    return {
      ...entry,
      score,
      finalScore,
      analysisMode: AnalysisMode.Predefined.ASSISTED,
      confidence
    };
  }

  private calculateRelevanceScore(url: string, resourceTypes: AnalysisMode.ResourceType[], criteria: AnalysisMode.FilteringConfig): number {
    let score = 0;
    
    if(criteria.endpointPatterns.include.some(p => p.test(url))) score += 50;
    if(criteria.endpointPatterns.exclude.some(p => p.test(url))) score -= 50;

    criteria.endpointPatterns.priorityPatterns.forEach(p => {
        if (p.pattern.test(url)) score += p.weight;
    });

    resourceTypes.forEach(rt => {
        score += criteria.resourceTypeWeights.get(rt) || 0;
    });

    return Math.max(0, Math.min(100, score));
  }

  private calculateSecurityScore(characteristics: AnalysisMode.EndpointCharacteristics): number {
    let score = 50;
    if (characteristics.hasAuthentication) score += 20;
    if (characteristics.hasSensitiveData) score += 30;
    if (!characteristics.isIdempotent) score += 10;
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateBusinessLogicScore(resourceTypes: AnalysisMode.ResourceType[], characteristics: AnalysisMode.EndpointCharacteristics): number {
    let score = 0;
    if (resourceTypes.includes(AnalysisMode.ResourceType.API_ENDPOINT)) score += 20;
    if (resourceTypes.includes(AnalysisMode.ResourceType.FORM_SUBMISSION)) score += 30;
    if (characteristics.hasStateChange) score += 25;
    return Math.max(0, Math.min(100, score));
  }

  private calculateTemporalScore(currentIndex: number, totalEntries: number): number {
    return 100 - (currentIndex / totalEntries) * 100;
  }
  
  private calculateContextualScore(entry: HarEntry, context: AnalysisContext, criteria: AnalysisMode.FilteringConfig): number {
    const { allEntries, currentIndex } = context;

    const requestContext: AnalysisMode.AnalysisContext = {
        previousRequests: allEntries.slice(0, currentIndex),
        sessionState: { isAuthenticated: false }, // Simplified for now
        criteria: criteria,
        allEntries: allEntries,
        currentIndex: currentIndex
    };
    
    let score = 0;
    criteria.contextualRules.forEach(rule => {
        if(rule.condition(entry, requestContext)) {
            score += rule.weight * 100;
        }
    });
    return Math.max(0, Math.min(100, score));
  }

  private calculateFinalScore(score: ScoredEntry['score'], criteria: AnalysisMode.FilteringConfig): number {
    const totalScore = Object.values(score).reduce((acc, val) => acc + val, 0);
    const avgScore = totalScore / Object.keys(score).length;
    
    if (avgScore < criteria.scoreThresholds.minimum) return 0;
    if (avgScore > criteria.scoreThresholds.optimal) return 100;
    
    return avgScore;
  }
  
  private calculateConfidence(score: ScoredEntry['score']): number {
    const variance = Object.values(score).map(val => Math.pow(val - 50, 2)).reduce((acc, val) => acc + val, 0) / Object.keys(score).length;
    return 1 - Math.sqrt(variance) / 50;
  }
}

// --- Factory ---

export class ScoringStrategyFactory {
  static getScoringService(): EndpointScoringService {
    return new EndpointScoringService();
  }
}
