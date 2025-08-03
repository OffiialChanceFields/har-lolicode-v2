
// src/services/AsyncHarProcessor.ts
import { StreamingHarParser } from './StreamingHarParser';
import { ProductionTokenDetector, HarEntry, DetectedToken } from './TokenDetector';
import { AnalysisMode } from './AnalysisMode';
import { EndpointScoringService, ScoredEntry, AnalysisContext } from './scoring';
import { ContextualCodeGenerator } from './codeGenerator';

interface ProcessingResult {
  loliCode: string;
  analysis: {
    requestsFound: number;
    tokensDetected: number;
    criticalPath: string[];
    matchedPatterns: any[];
  };
}

interface EnrichedHarEntry {
    entry: ScoredEntry;
    produces: DetectedToken[];
    score: number;
}

class MemoryOptimizedProcessor {
  // ... (existing implementation)
  private readonly memoryThreshold = 500 * 1024 * 1024; // 500MB
  private harContent: string;
  private streamingParser: StreamingHarParser;

  constructor(harContent: string) {
    this.harContent = harContent;
    this.streamingParser = new StreamingHarParser();
    this.monitorMemory();
  }

  async *createHarStream(): AsyncGenerator<HarEntry[]> {
    yield* this.streamingParser.parseHarEntriesAsync(this.harContent);
  }

  private monitorMemory() {
    if (typeof performance?.memory === 'undefined') return;
    const memory = performance.memory;
    if (memory.usedJSHeapSize > this.memoryThreshold) {
      this.harContent = "";
    }
  }
}

class BehavioralPatternMatcher {
    static matchPatterns(entries: HarEntry[], patterns: AnalysisMode.BehavioralPattern[]): any[] {
        const matchedData: any[] = [];
        for (const behavioralPattern of patterns) {
            for(let i=0; i< entries.length; i++) {
                let localMatch = true;
                const matchedEntries: HarEntry[] = [];
                for(let j=0; j<behavioralPattern.pattern.length; j++) {
                    const entryIndex = i+j;
                    if(entryIndex >= entries.length) {
                        localMatch = false;
                        break;
                    }
                    
                    const entry = entries[entryIndex];
                    const pattern = behavioralPattern.pattern[j];
                    
                    if(pattern.urlPattern && !pattern.urlPattern.test(entry.request.url)) {
                        localMatch = false;
                        break;
                    }
                    if(pattern.methodPattern && !pattern.methodPattern.includes(entry.request.method)) {
                        localMatch = false;
                        break;
                    }
                    if(pattern.statusPattern && !pattern.statusPattern.includes(entry.response.status)) {
                        localMatch = false;
                        break;
                    }
                    matchedEntries.push(entry);

                }
                if(localMatch) {
                    matchedData.push(behavioralPattern.extract(matchedEntries));
                    i += behavioralPattern.pattern.length - 1;
                }
            }
        }
        return matchedData;
    }
}

export class AsyncHarProcessor {
    static async processHarFileStreaming(
        harContent: string,
        config: AnalysisMode.Configuration,
        progressCallback?: (progress: number, stage: string) => void
    ): Promise<ProcessingResult> {
        this.validateHarContent(harContent);

        const memoryProcessor = new MemoryOptimizedProcessor(harContent);
        const stream = memoryProcessor.createHarStream();
    
        const allEntries: HarEntry[] = [];
        progressCallback?.(0, 'streaming');
        for await (const entryBatch of stream) {
            allEntries.push(...entryBatch);
            progressCallback?.(50, 'streaming');
        }
        progressCallback?.(100, 'streaming');

        if (allEntries.length === 0) {
            throw new Error(`No network requests found in the HAR file. Please ensure the file is valid and contains captured traffic.`);
        }

        // 1. Contextual Scoring & Filtering
        progressCallback?.(0, 'scoring');
        const scoringService = new EndpointScoringService();
        const analysisContext: Omit<AnalysisContext, 'currentIndex'> = { allEntries, criteria: config.filtering };

        const scoredEntries: ScoredEntry[] = [];
        for (let i = 0; i < allEntries.length; i++) {
            const entryContext = { ...analysisContext, currentIndex: i };
            const scoredEntry = scoringService.scoreEntry(allEntries[i], entryContext);
            if (scoredEntry.finalScore >= config.filtering.scoreThresholds.includeThreshold) {
                scoredEntries.push(scoredEntry);
            }
            progressCallback?.( (i / allEntries.length) * 100, 'scoring');
        }
        progressCallback?.(100, 'scoring');

        if (scoredEntries.length === 0) {
            throw new Error(`No relevant requests found after scoring and filtering. Try adjusting the filtering criteria.`);
        }
        
        // 2. Behavioral Pattern Matching
        progressCallback?.(0, 'behavioral_analysis');
        const matchedPatterns = BehavioralPatternMatcher.matchPatterns(scoredEntries, config.filtering.behavioralPatterns);
        progressCallback?.(100, 'behavioral_analysis');


        // 3. Dependency Analysis
        progressCallback?.(0, 'analysis');
        const { enrichedPath, allTokens } = await this.analyzeDependencies(scoredEntries);
        progressCallback?.(100, 'analysis');

        // 4. Contextual Code Generation
        progressCallback?.(0, 'generation');
        const codeGenerator = new ContextualCodeGenerator(config.mode, config.codeGeneration.template);
        const loliCode = codeGenerator.generateOptimizedLoliCode(
            enrichedPath.map(e => e.entry), 
            allTokens, 
            {
                includeAnalysisModeMetadata: true,
                optimizeForContext: true,
                generateValidationBlocks: true
            }
        );
        progressCallback?.(100, 'generation');

        return {
            loliCode,
            analysis: {
                requestsFound: scoredEntries.length,
                tokensDetected: allTokens.length,
                criticalPath: enrichedPath.map(e => `${e.entry.request.method} ${new URL(e.entry.request.url).pathname}`),
                matchedPatterns
            }
        };
    }

    private static validateHarContent(harContent: string): void {
        if (!harContent.trim()) {
            throw new Error("The HAR file is empty. Please upload a valid HAR file.");
        }
        try {
            const har = JSON.parse(harContent);
            if (!har.log || !Array.isArray(har.log.entries) || har.log.entries.length === 0) {
                throw new Error("Invalid HAR file format. The file must contain a 'log' object with a non-empty 'entries' array.");
            }
        } catch (error) {
            throw new Error("Failed to parse HAR file. The file may be malformed or not in valid JSON format.");
        }
    }

    private static async analyzeDependencies(
        scoredEntries: ScoredEntry[]
    ): Promise<{ enrichedPath: EnrichedHarEntry[], allTokens: DetectedToken[] }> {
        const criticalPath = scoredEntries.sort((a, b) => b.finalScore - a.finalScore).slice(0, 10);
        const tokenDetector = new ProductionTokenDetector();
        const allTokens: DetectedToken[] = [];
    
        const enrichedPath: EnrichedHarEntry[] = criticalPath.map(entry => ({
            entry: entry,
            produces: [],
            score: entry.finalScore,
        }));

        if (enrichedPath.length < 2) {
            return { enrichedPath, allTokens };
        }
  
        for (let i = 0; i < enrichedPath.length - 1; i++) {
            const producer = enrichedPath[i].entry;
            const consumer = enrichedPath[i + 1].entry;
      
            const detected = await tokenDetector.detectDynamicTokens([producer, consumer]);
      
            if (detected.length > 0) {
                const tokensWithProducer = detected.map(token => ({...token, producerIndex: i}));
                enrichedPath[i].produces.push(...tokensWithProducer);
                allTokens.push(...tokensWithProducer);
            }
        }
    
        return { enrichedPath, allTokens };
    }
}
