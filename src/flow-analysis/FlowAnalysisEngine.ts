// src/flow-analysis/FlowAnalysisEngine.ts
import { HarEntry } from '../services/types';
import { TemporalCorrelationAnalyzer } from './TemporalCorrelationAnalyzer';
import {
  BehavioralPatternMatcher,
  PatternMatch
} from './BehavioralPatternMatcher';
import { StateTransitionModeler } from './StateTransitionModeler';
import { FlowValidationEngine } from './FlowValidationEngine';
import { AuthenticationPatternLibrary } from '../pattern-library/AuthenticationPatternLibrary';
import { EndpointClassifier } from '../core/EndpointClassifier';
import { FlowContextResult } from './types';

export class FlowAnalysisEngine {
  private readonly temporalCorrelationAnalyzer: TemporalCorrelationAnalyzer;
  private readonly behavioralPatternMatcher: BehavioralPatternMatcher;
  private readonly stateTransitionModeler: StateTransitionModeler;
  private readonly flowValidationEngine: FlowValidationEngine;
  private readonly patternLibrary: AuthenticationPatternLibrary;
  private readonly endpointClassifier: EndpointClassifier;

  constructor(
    patternLibrary: AuthenticationPatternLibrary,
    endpointClassifier: EndpointClassifier
  ) {
    this.patternLibrary = patternLibrary;
    this.endpointClassifier = endpointClassifier;
    this.temporalCorrelationAnalyzer = new TemporalCorrelationAnalyzer();
    this.behavioralPatternMatcher = new BehavioralPatternMatcher(
      this.patternLibrary
    );
    this.stateTransitionModeler = new StateTransitionModeler();
    this.flowValidationEngine = new FlowValidationEngine();
  }

  analyzeFlowContext(
    requests: HarEntry[],
    correlationMatrix: number[][],
    criticalPathIndices: number[]
  ): FlowContextResult {
    // Temporal analysis with microsecond precision
    const temporalMap = this.temporalCorrelationAnalyzer.analyze(requests);

    // Dependency chain analysis
    const dependencyChains =
      this.temporalCorrelationAnalyzer.extractDependencyChains(
        requests,
        correlationMatrix
      );

    // Pattern matching against known authentication flows
    const criticalPathEntries = criticalPathIndices.map((idx) => requests[idx]);
    const matchedPatterns =
      this.behavioralPatternMatcher.matchPatterns(criticalPathEntries);

    // State transition modeling
    const stateTransitions = this.stateTransitionModeler.modelStateTransitions(
      criticalPathEntries,
      matchedPatterns
    );

    // Flow validation
    const flowCompleteness = this.flowValidationEngine.validateFlow(
      criticalPathEntries,
      matchedPatterns,
      stateTransitions
    );

    // Identify redundant requests
    const redundantIndices = this.identifyRedundantRequests(
      requests,
      correlationMatrix,
      criticalPathIndices
    );
    const redundantRequests = redundantIndices.map((idx) => requests[idx]);

    return {
      temporalMap,
      dependencyChains,
      matchedPatterns: matchedPatterns.map((p) => ({
        patternId: p.patternId,
        confidence: p.confidence,
        steps: p.steps
      })),
      criticalPath: criticalPathEntries,
      redundantRequests,
      flowCompleteness
    };
  }

  private identifyRedundantRequests(
    requests: HarEntry[],
    correlationMatrix: number[][],
    criticalPathIndices: number[]
  ): number[] {
    const redundant: number[] = [];
    const criticalSet = new Set(criticalPathIndices);

    for (let i = 0; i < requests.length; i++) {
      if (criticalSet.has(i)) continue;

      // Check if this request is highly correlated with multiple critical requests
      let correlationCount = 0;
      for (const criticalIdx of criticalPathIndices) {
        if (correlationMatrix[i][criticalIdx] > 0.7) {
          correlationCount++;
        }
      }

      // If correlated with more than one critical request, it might be redundant
      if (correlationCount > 1) {
        redundant.push(i);
      }
    }

    return redundant;
  }
}
