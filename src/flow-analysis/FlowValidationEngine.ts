// src/flow-analysis/FlowValidationEngine.ts
import { HarEntry } from '../types';
import { PatternMatch } from './BehavioralPatternMatcher';
import { StateTransition } from './StateTransitionModeler';

export class FlowValidationEngine {
  validateFlow(
    requests: HarEntry[],
    patternMatches: PatternMatch[],
    stateTransitions: StateTransition[]
  ): number {
    let completeness = 0;
    
    // If we have a complete pattern match, use that
    if (patternMatches.length > 0) {
      const totalConfidence = patternMatches.reduce((acc, match) => acc + match.confidence, 0);
      completeness = (totalConfidence / patternMatches.length) * 0.7;
    }
    
    // Check for critical components with more flexible criteria
    const hasLoginRequest = requests.some(r =>
      /\/(login|signin|auth|authenticate)/i.test(r.request.url) &&
      (r.request.method === 'GET' || r.request.method === 'POST')
    );
    
    const hasAuthSubmission = requests.some(r =>
      /\/(login|signin|auth|authenticate|session|token)/i.test(r.request.url) &&
      (r.request.method === 'POST' || r.request.method === 'PUT')
    );
    
    const hasSessionEstablishment = requests.some(r =>
      r.response.headers.some(h =>
        h.name.toLowerCase() === 'set-cookie' &&
        (h.value.includes('session') || h.value.includes('auth') || h.value.includes('token'))
      ) || r.response.content?.text?.includes('token')
    );
    
    // More flexible completeness calculation
    const criticalComponents = [
      hasLoginRequest,
      hasAuthSubmission,
      hasSessionEstablishment
    ];
    
    const criticalCompleteness = criticalComponents.filter(c => c).length / criticalComponents.length;
    completeness = Math.max(completeness, criticalCompleteness * 0.5);
    
    // Keep the rest of the validation logic but make it less strict
    return Math.min(1.0, completeness);
  }
}