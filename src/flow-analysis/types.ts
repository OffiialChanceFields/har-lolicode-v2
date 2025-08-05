// src/flow-analysis/types.ts
import { HarEntry } from '../services/types';

export interface FlowContextResult {
  temporalMap: Map<string, number>;
  dependencyChains: Array<{
    start: number;
    end: number;
    strength: number;
  }>;
  matchedPatterns: Array<{
    patternId: string;
    confidence: number;
    steps: HarEntry[];
  }>;
  criticalPath: HarEntry[];
  redundantRequests: HarEntry[];
  flowCompleteness: number;
}

export interface StateTransition {
  fromState: string;
  toState: string;
  trigger: HarEntry;
  confidence: number;
}

// Re-export PatternMatch as MatchedPattern for wider use
import { PatternMatch } from './BehavioralPatternMatcher';
export type MatchedPattern = PatternMatch;
