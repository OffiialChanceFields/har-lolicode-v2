
import { AnalysisMode } from './AnalysisMode';
import { HarEntry } from './TokenDetector';

// --- Enhanced Interfaces and Types ---

export interface ScoredEntry extends HarEntry {
  score: AnalysisMode.EndpointScore;
  finalScore: number;
  analysisMode: AnalysisMode.Predefined;
  confidence: number;
}

export interface AnalysisContext {
  allEntries: HarEntry[];
  currentIndex: number;
  criteria: AnalysisMode.EnhancedFilteringCriteria;
}

// --- Endpoint Classifier ---

class EndpointClassifier implements AnalysisMode.EndpointClassifier {
  classifyEndpoint(request: Request): AnalysisMode.ResourceType[] {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    const { method } = request;
    const resources: AnalysisMode.ResourceType[] = [];

    if (path.endsWith('.html') || path === '/') {
      resources.push(AnalysisMode.ResourceType.HTML_DOCUMENT);
    }
    if (path.includes('api')) {
        resources.push(AnalysisMode.ResourceType.API_ENDPOINT);
    }
    if (path.includes('auth') || path.includes('login') || path.includes('signin')) {
        resources.push(AnalysisMode.ResourceType.AUTHENTICATION);
    }
    if(method === 'POST' && (path.includes('form') || path.includes('submit'))) {
        resources.push(AnalysisMode.ResourceType.FORM_SUBMISSION);
    }
    if (method === 'POST' && (path.includes('upload') || path.includes('media'))) {
        resources.push(AnalysisMode.ResourceType.FILE_UPLOAD);
    }
    if (url.protocol.startsWith('ws')) {
        resources.push(AnalysisMode.ResourceType.WEBSOCKET);
    }
    if (path.includes('graphql')) {
        resources.push(AnalysisMode.ResourceType.GRAPHQL);
    }
    if (path.includes('rest')) {
        resources.push(AnalysisMode.ResourceType.REST_API);
    }
    if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/.test(path)) {
        resources.push(AnalysisMode.ResourceType.STATIC_ASSET);
    }
    if (path.includes('track') || path.includes('analytics')) {
        resources.push(AnalysisMode.ResourceType.TRACKING);
    }
    if (url.hostname !== location.hostname) {
        resources.push(AnalysisMode.ResourceType.THIRD_PARTY);
    }
    
    return resources;
  }

  getEndpointCharacteristics(url: string, request: Request, postData?: string): AnalysisMode.EndpointCharacteristics {
    const { method } = request;
    const hasAuthentication = postData?.includes('token') || postData?.includes('apikey') || false;
    const hasStateChange = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const hasDataSubmission = ['POST', 'PUT', 'PATCH'].includes(method);
    const hasSensitiveData = postData?.includes('password') || postData?.includes('credit_card') || false;
    const isIdempotent = ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method);
    const httpMethods = [method];
    const parameterTypes = this.getParameterTypes(postData);

    return {
      hasAuthentication,
      hasStateChange,
      hasDataSubmission,
      hasSensitiveData,
      isIdempotent,
      httpMethods,
      parameterTypes,
    };
  }

  private getParameterTypes(postData?: string): AnalysisMode.ParameterType[] {
    const types: AnalysisMode.ParameterType[] = [];
    if (!postData) return types;
    try {
      const parsed = JSON.parse(postData);
      Object.values(parsed).forEach(value => {
        if (typeof value === 'string') types.push(AnalysisMode.ParameterType.STRING);
        if (typeof value === 'number') types.push(AnalysisMode.ParameterType.NUMBER);
        if (typeof value === 'boolean') types.push(AnalysisMode.ParameterType.BOOLEAN);
        if (typeof value === 'object' && !Array.isArray(value)) types.push(AnalysisMode.ParameterType.OBJECT);
        if (Array.isArray(value)) types.push(AnalysisMode.ParameterType.ARRAY);
      });
    } catch (e) {
      // Not a JSON object
    }
    return types;
  }
}

// --- Scoring Service ---

export class EndpointScoringService {
  private classifier = new EndpointClassifier();

  public scoreEntry(entry: HarEntry, context: AnalysisContext): ScoredEntry {
    const { criteria } = context;
    const { request } = entry;
    
    const resourceTypes = this.classifier.classifyEndpoint(request as any);
    const characteristics = this.classifier.getEndpointCharacteristics(request.url, request as any, request.postData?.text);

    const score: AnalysisMode.EndpointScore = {
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
      analysisMode: context.criteria.endpointPatterns ? AnalysisMode.Predefined.ASSISTED : AnalysisMode.Predefined.AUTOMATIC,
      confidence
    };
  }

  private calculateRelevanceScore(url: string, resourceTypes: AnalysisMode.ResourceType[], criteria: AnalysisMode.EnhancedFilteringCriteria): number {
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
  
  private calculateContextualScore(entry: HarEntry, context: AnalysisContext, criteria: AnalysisMode.EnhancedFilteringCriteria): number {
    const { allEntries, currentIndex } = context;

    const requestContext: AnalysisMode.RequestContext = {
        previousRequests: allEntries.slice(0, currentIndex),
        subsequentRequests: allEntries.slice(currentIndex + 1),
        sessionState: { isAuthenticated: false }, // Simplified for now
        timeWindow: {
            start: new Date(allEntries[0].startedDateTime),
            end: new Date(allEntries[allEntries.length - 1].startedDateTime)
        },
        referrerChain: this.buildReferrerChain(entry, allEntries)
    };
    
    let score = 0;
    criteria.contextualRules.forEach(rule => {
        if(rule.condition(entry, requestContext)) {
            score += rule.weight * 100;
        }
    });
    return Math.max(0, Math.min(100, score));
  }

  private buildReferrerChain(entry: HarEntry, allEntries: HarEntry[]): string[] {
      const chain: string[] = [];
      let currentEntry: HarEntry | undefined = entry;
      while(currentEntry) {
          chain.unshift(currentEntry.request.url);
          const referrerHeader = currentEntry.request.headers.find(h => h.name.toLowerCase() === 'referer');
          if (referrerHeader) {
              currentEntry = allEntries.find(e => e.request.url === referrerHeader.value);
          } else {
              currentEntry = undefined;
          }
      }
      return chain;
  }

  private calculateFinalScore(score: AnalysisMode.EndpointScore, criteria: AnalysisMode.EnhancedFilteringCriteria): number {
    const totalScore = Object.values(score).reduce((acc, val) => acc + val, 0);
    const avgScore = totalScore / Object.keys(score).length;
    
    if (avgScore < criteria.scoreThresholds.minimum) return 0;
    if (avgScore > criteria.scoreThresholds.optimal) return 100;
    
    return avgScore;
  }
  
  private calculateConfidence(score: AnalysisMode.EndpointScore): number {
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
