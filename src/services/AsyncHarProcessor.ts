// src/services/AsyncHarProcessor.ts
import { StreamingHarParser } from './StreamingHarParser';
import { ProductionTokenDetector, HarEntry, DetectedToken } from './TokenDetector';
import { AnalysisModeConfiguration, AnalysisMode, ValidationRuleSet, DomainStrictnessLevel } from './AnalysisMode';
import { ScoringStrategyFactory, ScoredEntry, AnalysisContext } from './scoring';
import { ContextualCodeGenerator } from './codeGenerator';

interface ProcessingResult {
  loliCode: string;
  analysis: {
    requestsFound: number;
    tokensDetected: number;
    criticalPath: string[];
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

export class AsyncHarProcessor {
    static async processHarFileStreaming(
        harContent: string,
        targetUrl: string,
        config: AnalysisModeConfiguration,
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

        // 1. Contextual Filtering
        progressCallback?.(0, 'filtering');
        let filteredEntries = this.applyContextualFiltering(allEntries, targetUrl, config);
        filteredEntries = this.applyIntelligentFiltering(filteredEntries, targetUrl);
        progressCallback?.(100, 'filtering');

        if (filteredEntries.length === 0) {
            throw new Error(`No relevant requests found for mode "${config.mode}" and target "${targetUrl}". Try a different analysis mode or verify the target URL.`);
        }

        // 2. Contextual Scoring
        progressCallback?.(0, 'scoring');
        const scoringStrategy = ScoringStrategyFactory.getStrategy(config.mode);
        const scoredEntries: ScoredEntry[] = [];
        const analysisContext: Omit<AnalysisContext, 'currentIndex'> = { allEntries: filteredEntries, targetUrl };

        for (let i = 0; i < filteredEntries.length; i++) {
            const entryContext = { ...analysisContext, currentIndex: i };
            const scoredEntry = await scoringStrategy.computeScore(filteredEntries[i], entryContext);
            scoredEntries.push(scoredEntry);
            progressCallback?.( (i / filteredEntries.length) * 100, 'scoring');
        }
        progressCallback?.(100, 'scoring');
    
        // 3. Dependency Analysis
        progressCallback?.(0, 'analysis');
        const { enrichedPath, allTokens } = await this.analyzeDependencies(scoredEntries);
        progressCallback?.(100, 'analysis');

        // 4. Contextual Code Generation
        progressCallback?.(0, 'generation');
        const codeGenerator = new ContextualCodeGenerator(config.mode, config.codeGenerationTemplate);
        const loliCode = codeGenerator.generateOptimizedLoliCode(
            enrichedPath.map(e => e.entry), 
            allTokens, 
            {
                includeAnalysisModeMetadata: true,
                optimizeForContext: true,
                generateValidationBlocks: config.validationRules !== ValidationRuleSet.MINIMAL_VALIDATION
            }
        );
        progressCallback?.(100, 'generation');

        return {
            loliCode,
            analysis: {
                requestsFound: filteredEntries.length,
                tokensDetected: allTokens.length,
                criticalPath: enrichedPath.map(e => `${e.entry.request.method} ${new URL(e.entry.request.url).pathname}`)
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

    private static applyIntelligentFiltering(entries: HarEntry[], targetUrl: string): HarEntry[] {
        if (!targetUrl) return entries;

        const API_KEYWORDS = ['api', 'v1', 'v2', 'v3', 'rest', 'graphql'];
        
        let baseDomain: string;
        try {
            baseDomain = new URL(targetUrl).hostname.split('.').slice(-2)[0];
        } catch (error) {
            console.warn("Could not extract base domain from target URL. Intelligent filtering may not be effective.");
            return entries;
        }

        return entries.filter(entry => {
            const url = entry.request.url.toLowerCase();
            const containsBaseDomain = url.includes(baseDomain);
            const containsApiKeyword = API_KEYWORDS.some(keyword => url.includes(keyword));
            
            return containsBaseDomain && containsApiKeyword;
        });
    }

    private static applyContextualFiltering(entries: HarEntry[], targetUrl: string, config: AnalysisModeConfiguration): HarEntry[] {
        const { filteringCriteria, mode } = config;
        const { domainStrictness = DomainStrictnessLevel.ANY_SUBDOMAIN } = filteringCriteria;

        let targetHost: string | null = null;
        if (targetUrl) {
            try {
                targetHost = new URL(targetUrl).hostname;
            } catch (error) {
                console.warn("Invalid target URL provided. Domain filtering will be skipped.");
            }
        }
        
        const domainFiltered = targetHost
            ? entries.filter(entry => {
                try {
                    const entryHost = new URL(entry.request.url).hostname;
                    switch (domainStrictness) {
                        case DomainStrictnessLevel.EXACT_MATCH:
                            return entryHost === targetHost;
                        case DomainStrictnessLevel.SAME_SUBDOMAIN:
                            return entryHost === targetHost || entryHost.endsWith(`.${targetHost}`);
                        case DomainStrictnessLevel.ANY_SUBDOMAIN: {
                            const baseDomain = targetHost.split('.').slice(-2).join('.');
                            const entryBaseDomain = entryHost.split('.').slice(-2).join('.');
                            return entryBaseDomain === baseDomain;
                        }
                        default:
                            return false;
                    }
                } catch { 
                    return false; 
                }
            })
            : entries;


        if (!filteringCriteria) return domainFiltered;

        return domainFiltered.filter(entry => {
            switch (mode) {
                case AnalysisMode.INITIAL_PAGE_LOAD:
                    if (entry.request.method !== 'GET') return false;
                    if (filteringCriteria.excludeXHRRequests && this.isXHRRequest(entry)) return false;
                    if (filteringCriteria.prioritizeHTMLResponses) return entry.response.content.mimeType.includes('text/html');
                    return true;
        
                case AnalysisMode.FAILED_AUTHENTICATION:
                    if (entry.request.method === 'POST' && filteringCriteria.statusCodeFiltering?.includes(entry.response.status)) return true;
                    return !!(filteringCriteria.includeRedirectChains && entry.response.status >= 300 && entry.response.status < 400);

                case AnalysisMode.SUCCESSFUL_AUTHENTICATION:
                    if (entry.request.method === 'POST' && filteringCriteria.statusCodeFiltering?.includes(entry.response.status)) return true;
                    return !!(filteringCriteria.includeSessionEstablishment && entry.response.headers.some(h => h.name.toLowerCase() === 'set-cookie'));

                default: // COMPREHENSIVE_FLOW and CUSTOM_PATTERN default to broader filtering
                    return !(!filteringCriteria.includeStaticResources && this.isStaticResource(entry));
            }
        });
    }
  
    private static isXHRRequest(entry: HarEntry): boolean {
        return entry.request.headers.some(h => h.name.toLowerCase() === 'x-requested-with' && h.value === 'XMLHttpRequest');
    }

    private static isStaticResource(entry: HarEntry): boolean {
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', 'ttf', '.eot'];
        return staticExtensions.some(ext => new URL(entry.request.url).pathname.endsWith(ext));
    }

    private static async analyzeDependencies(
        scoredEntries: ScoredEntry[]
    ): Promise<{ enrichedPath: EnrichedHarEntry[], allTokens: DetectedToken[] }> {
        const criticalPath = scoredEntries.sort((a, b) => b.score - a.score).slice(0, 5);
        const tokenDetector = new ProductionTokenDetector();
        const allTokens: DetectedToken[] = [];
    
        const enrichedPath: EnrichedHarEntry[] = criticalPath.map(entry => ({
            entry: entry,
            produces: [],
            score: entry.score,
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
