// src/flow-analysis/StateTransitionModeler.ts
import { HarEntry } from '../services/types';
import { PatternMatch } from './BehavioralPatternMatcher';

export interface StateTransition {
  from: string;
  to: string;
  trigger: string;
  confidence: number;
}

export class StateTransitionModeler {
  modelStateTransitions(
    requests: HarEntry[],
    patternMatches: PatternMatch[]
  ): StateTransition[] {
    const transitions: StateTransition[] = [];
    
    // If we have a pattern match, use it to model state transitions
    if (patternMatches.length > 0) {
      const primaryMatch = patternMatches[0];
      return this.modelPatternTransitions(primaryMatch);
    }
    
    // Fallback: model transitions based on request sequence and response codes
    for (let i = 0; i < requests.length - 1; i++) {
      const fromState = this.inferState(requests[i]);
      const toState = this.inferState(requests[i + 1]);
      
      if (fromState !== toState) {
        transitions.push({
          from: fromState,
          to: toState,
          trigger: requests[i].request.url,
          confidence: this.calculateTransitionConfidence(requests[i], requests[i + 1])
        });
      }
    }
    
    return transitions;
  }
  
  private modelPatternTransitions(patternMatch: PatternMatch): StateTransition[] {
    const transitions: StateTransition[] = [];
    const steps = patternMatch.steps;
    
    for (let i = 0; i < steps.length - 1; i++) {
      transitions.push({
        from: this.getStateName(steps[i]),
        to: this.getStateName(steps[i + 1]),
        trigger: steps[i].request.url,
        confidence: patternMatch.confidence
      });
    }
    
    return transitions;
  }
  
  private inferState(entry: HarEntry): string {
    if (entry.response.status >= 200 && entry.response.status < 300) {
      if (/\/(login|signin|auth)/i.test(entry.request.url)) {
        return 'AUTHENTICATED';
      }
      
      if (entry.response.headers.some(h => 
        h.name.toLowerCase() === 'set-cookie' && 
        (h.value.includes('session') || h.value.includes('auth'))
      )) {
        return 'AUTHENTICATED';
      }
    }
    
    if (/\/(login|signin)/i.test(entry.request.url) && entry.request.method === 'GET') {
      return 'LOGIN_PAGE';
    }
    
    if (/\/(login|signin)/i.test(entry.request.url) && entry.request.method === 'POST') {
      return 'AUTHENTICATION_SUBMITTED';
    }
    
    return 'GENERAL';
  }
  
  private getStateName(entry: HarEntry): string {
    const url = new URL(entry.request.url);
    const path = url.pathname;
    
    if (/\/(login|signin)/i.test(path) && entry.request.method === 'GET') {
      return 'LOGIN_PAGE';
    }
    
    if (/\/(login|signin|authenticate)/i.test(path) && entry.request.method === 'POST') {
      return 'AUTH_SUBMISSION';
    }
    
    if (entry.response.status === 302 || entry.response.status === 303) {
      return 'REDIRECT';
    }
    
    if (entry.response.headers.some(h => 
      h.name.toLowerCase() === 'set-cookie' && 
      (h.value.includes('session') || h.value.includes('auth'))
    )) {
      return 'SESSION_ESTABLISHED';
    }
    
    return 'GENERAL';
  }
  
  private calculateTransitionConfidence(
    fromEntry: HarEntry, 
    toEntry: HarEntry
  ): number {
    let confidence = 0.7;
    
    // Check if there's a referer relationship
    const refererHeader = toEntry.request.headers.find(h => 
      h.name.toLowerCase() === 'referer' || h.name.toLowerCase() === 'referrer'
    );
    
    if (refererHeader && refererHeader.value.includes(fromEntry.request.url)) {
      confidence += 0.2;
    }
    
    // Check if cookies are carried over
    const cookiesBefore = new Set(fromEntry.response.cookies.map(c => c.name));
    const cookiesAfter = new Set(toEntry.request.cookies.map(c => c.name));
    
    let matchingCount = 0;
    cookiesBefore.forEach(cookie => {
      if (cookiesAfter.has(cookie)) matchingCount++;
    });
    
    if (matchingCount > 0) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }
}