import { EndpointScoringService, AnalysisContext } from './scoring';
import {
  StreamingHarParser,
  ParseStatistics
} from '../core/StreamingHarParser';
import { AnalysisMode } from './AnalysisMode';
import { TokenDetectionService } from '../token-extraction/TokenDetectionService';
import { OB2SyntaxComplianceEngine } from '../syntax-compliance/OB2SyntaxComplianceEngine';
import { FlowAnalysisEngine } from '../flow-analysis/FlowAnalysisEngine';
import { AuthenticationPatternLibrary } from '../pattern-library/AuthenticationPatternLibrary';
import { EndpointClassifier } from '../core/EndpointClassifier';
import { RequestDependencyAnalyzer } from './dependency/RequestDependencyAnalyzer';
import { RequestOptimizationEngine } from './optimization/RequestOptimizationEngine';
import { MFAFlowAnalyzer } from './mfa/MFAFlowAnalyzer';

import { HarEntry, HarAnalysisResult } from './types';

export class AsyncHarProcessor {
  public static async processHarFileStreaming(
    harContent: string,
    config: AnalysisMode.AnalysisConfig,
    progressCallback?: (progress: number, stage: string) => void
  ): Promise<HarAnalysisResult> {
    this.validateHarContent(harContent);

    const allEntries: HarEntry[] = [];
    const parser = new StreamingHarParser({
      validateEntries: true,
      skipLargeResponses: true
    });

    parser.on('progress', (progress) => {
      // Pass along parsing progress if needed
    });

    parser.on('error', (error) => {
      throw new Error(`Failed to parse HAR file: ${error.message}`);
    });

    // Use the new asynchronous parser
    for await (const batch of parser.parseHarEntriesAsync(harContent)) {
      allEntries.push(...batch);
    }
    const parseStats = parser.getStatistics();
    
    if (allEntries.length === 0) {
      throw new Error(
        'The HAR file is valid, but it contains no network requests.'
      );
    }

    // 1. Contextual Scoring & Filtering
    progressCallback?.(0, 'scoring');
    const scoringService = new EndpointScoringService();
    const analysisContext: Omit<AnalysisContext, 'currentIndex'> = {
      allEntries,
      criteria: config.filtering
    };

    const scoredEntries = allEntries
      .map((entry, index) =>
        scoringService.scoreEntry(entry, {
          ...analysisContext,
          currentIndex: index
        })
      )
      .filter((entry) => entry.finalScore > 0);

    if (scoredEntries.length === 0) {
      throw new Error(
        'No relevant requests found in the HAR file after filtering. Please check the analysis mode configuration or try a different HAR file.'
      );
    }

    // 2. Behavioral Analysis
    progressCallback?.(15, 'behavioral-analysis');
    const behavioralAnalyzer = new FlowAnalysisEngine(
      new AuthenticationPatternLibrary(),
      new EndpointClassifier()
    );
    // Note: The previous behavioralAnalyzer was a simpler one. 
    // This is now covered by the FlowAnalysisEngine.
    // We'll extract matchedPatterns from flowContext after analysis.

    // 3. Dependency Analysis
    progressCallback?.(30, 'dependency-analysis');
    const dependencyAnalyzer = new RequestDependencyAnalyzer();
    const correlationMatrix = await parser.analyzeCorrelations(scoredEntries);
    const criticalPathIndices = (parser as any).criticalPath || [];
    const dependencyAnalysis = dependencyAnalyzer.analyzeDependencies(scoredEntries);

    // 4. Request Optimization
    progressCallback?.(45, 'optimization');
    const optimizationEngine = new RequestOptimizationEngine();
    const optimizedFlow = optimizationEngine.optimizeRequestFlow(
      dependencyAnalysis.criticalPath
    );

    // 5. MFA Analysis
    progressCallback?.(60, 'mfa-analysis');
    const mfaAnalyzer = new MFAFlowAnalyzer();
    const mfaAnalysis = mfaAnalyzer.analyzeMFAFlow(
      optimizedFlow.optimizedRequests
    );

    // 6. Token Detection
    progressCallback?.(75, 'token-detection');

    const tokenDetector = new TokenDetectionService();
    const tokenExtractionResults = optimizedFlow.optimizedRequests.map((entry) => {
      const responseBody = entry.response.content?.text || '';
      return tokenDetector.detectTokensWithContext(entry, responseBody);
    });

    // 7. Code Generation
    progressCallback?.(90, 'code-generation');

    const codeGenerator = new OB2SyntaxComplianceEngine();
    // Pass the relevant parts of the analysis to the code generator
    const codeGenResult = codeGenerator.generateCompliantLoliCode(behavioralAnalyzer.analyzeFlowContext(scoredEntries, correlationMatrix, criticalPathIndices));

    const analysisResult: HarAnalysisResult = {
      requests: optimizedFlow.optimizedRequests,
      metrics: {
        totalRequests: parseStats.totalEntries,
        significantRequests: scoredEntries.length,
        processingTime: parseStats.processingTimeMs
      },
      loliCode: codeGenResult.loliCode,
      tokenExtractionResults: tokenExtractionResults,
      matchedPatterns: behavioralAnalyzer.analyzeFlowContext(scoredEntries, correlationMatrix, criticalPathIndices).matchedPatterns, // Re-run or extract from flowContext
      dependencyAnalysis: dependencyAnalysis,
      optimizedFlow: optimizedFlow,
      mfaAnalysis: mfaAnalysis,
      flowContext: behavioralAnalyzer.analyzeFlowContext(scoredEntries, correlationMatrix, criticalPathIndices)
    };

    progressCallback?.(100, 'complete');

    return analysisResult;
  }

  private static validateHarContent(harContent: string): void {
    if (!harContent.trim()) {
      throw new Error('The HAR file is empty. Please upload a valid HAR file.');
    }
    try {
      const har = JSON.parse(harContent);
      if (!har.log || !Array.isArray(har.log.entries)) {
        throw new Error(
          "Invalid HAR file format. The file must contain a 'log' object with an 'entries' array."
        );
      }
    } catch (error) {
      throw new Error(
        'Failed to parse HAR file. The file may be malformed or not in valid JSON format.'
      );
    }
  }
}
