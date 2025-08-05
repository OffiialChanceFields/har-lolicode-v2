// src/flow-analysis/FlowValidationEngine.ts
import { HarEntry } from '../services/types';
import { PatternMatch } from './BehavioralPatternMatcher';
import { StateTransition } from './StateTransitionModeler';

export class FlowValidationEngine {
  validateFlow(
    requests: HarEntry[],
    patternMatches: PatternMatch[],
    stateTransitions: StateTransition[]
  ): number {
    let completeness = 0;
    
    // Check if we have a complete pattern match
    if (patternMatches.length > 0) {
      const primaryMatch = patternMatches[0];
      completeness = primaryMatch.confidence * 0.7;
    }
    
    // Check for critical components
    const hasLoginRequest = requests.some(r => 
      /\/(login|signin|auth)/i.test(r.request.url) && r.request.method === 'GET'
    );
    
    const hasAuthSubmission = requests.some(r => 
      /\/(login|signin|auth)/i.test(r.request.url) && r.request.method === 'POST'
    );
    
    const hasSessionEstablishment = requests.some(r => 
      r.response.headers.some(h => 
        h.name.toLowerCase() === 'set-cookie' && 
        (h.value.includes('session') || h.value.includes('auth'))
      )
    );
    
    const criticalComponents = [
      hasLoginRequest,
      hasAuthSubmission,
      hasSessionEstablishment
    ];
    
    const criticalCompleteness = criticalComponents.filter(c => c).length / criticalComponents.length;
    completeness = Math.max(completeness, criticalCompleteness * 0.6);
    
    // Check state transitions
    if (stateTransitions.length > 0) {
      const hasAuthTransition = stateTransitions.some(t => 
        t.from === 'LOGIN_PAGE' && t.to === 'AUTH_SUBMISSION'
      );
      
      const hasSessionTransition = stateTransitions.some(t => 
        t.from === 'AUTH_SUBMISSION' && t.to === 'SESSION_ESTABLISHED'
      );
      
      const transitionCompleteness = (hasAuthTransition ? 0.5 : 0) + (hasSessionTransition ? 0.5 : 0);
      completeness = Math.max(completeness, transitionCompleteness * 0.8);
    }
    
    return completeness;
  }
}