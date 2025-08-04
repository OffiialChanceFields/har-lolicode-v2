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
    const correlationMatrix = await parser.analyzeCorrelations(allEntries);
    const criticalPathIndices = (parser as any).criticalPath || [];

    if (allEntries.length === 0) {
      throw new Error(
        'The HAR file is valid, but it contains no network requests.'
      );
    }

    // 1. Unified Flow Analysis
    progressCallback?.(25, 'flow-analysis');
    const patternLibrary = new AuthenticationPatternLibrary();
    const endpointClassifier = new EndpointClassifier();
    const flowAnalyzer = new FlowAnalysisEngine(
      patternLibrary,
      endpointClassifier
    );
    const flowContext = flowAnalyzer.analyzeFlowContext(
      allEntries,
      correlationMatrix,
      criticalPathIndices
    );

    // 2. Token Detection
    progressCallback?.(60, 'token-detection');
    const tokenDetector = new TokenDetectionService();
    const tokenExtractionResults = flowContext.criticalPath.map((entry) => {
      const responseBody = entry.response.content?.text || '';
      return tokenDetector.detectTokensWithContext(entry, responseBody);
    });

    // 3. Code Generation
    progressCallback?.(80, 'code-generation');

    const codeGenerator = new OB2SyntaxComplianceEngine();
    const codeGenResult = codeGenerator.generateCompliantLoliCode(flowContext);

    const analysisResult: HarAnalysisResult = {
      requests: flowContext.criticalPath,
      metrics: {
        totalRequests: parseStats.totalEntries,
        significantRequests: flowContext.criticalPath.length,
        processingTime: parseStats.processingTimeMs
      },
      loliCode: codeGenResult.loliCode,
      tokenExtractionResults: tokenExtractionResults,
      flowContext: flowContext,
      // Deprecated fields, kept for compatibility for now
      matchedPatterns: [],
      dependencyAnalysis: undefined,
      optimizedFlow: undefined,
      mfaAnalysis: []
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
