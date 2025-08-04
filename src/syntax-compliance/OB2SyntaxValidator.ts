// src/syntax-compliance/OB2SyntaxValidator.ts
import { FlowContextResult } from '../flow-analysis/types';

export interface SyntaxValidationResult {
  isValid: boolean;
  violations: string[];
}

export class OB2SyntaxValidator {
  validateAnalysisResult(
    analysisResult: FlowContextResult
  ): SyntaxValidationResult {
    const violations: string[] = [];

    // Check if we have a critical path
    if (analysisResult.criticalPath.length === 0) {
      violations.push('No critical path identified');
    }

    // Check if we have at least one matching pattern
    if (analysisResult.matchedPatterns.length === 0) {
      violations.push('No authentication pattern matched');
    }

    // Check flow completeness
    if (analysisResult.flowCompleteness < 0.5) {
      violations.push('Flow completeness is too low');
    }

    // Check for required components
    const hasLoginRequest = analysisResult.criticalPath.some(
      (r) =>
        /\/(login|signin|auth)/i.test(r.request.url) &&
        r.request.method === 'GET'
    );

    const hasAuthSubmission = analysisResult.criticalPath.some(
      (r) =>
        /\/(login|signin|auth)/i.test(r.request.url) &&
        r.request.method === 'POST'
    );

    if (!hasLoginRequest) {
      violations.push('Missing login request (GET)');
    }

    if (!hasAuthSubmission) {
      violations.push('Missing authentication submission (POST)');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

export class OB2SyntaxValidationError extends Error {
  constructor(public violations: string[]) {
    super(`OB2 Syntax Validation Failed: ${violations.join(', ')}`);
  }
}
