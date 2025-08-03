import { EndpointScoringService, AnalysisContext } from './scoring';
import { StreamingHarParser } from './StreamingHarParser';
import { AnalysisMode } from './AnalysisMode';
import { ProductionTokenDetector } from './TokenDetector';

// Assuming HarEntry and HarAnalysisResult are defined elsewhere
import { HarEntry, HarAnalysisResult } from './types'; // You might need to create a types file

export class AsyncHarProcessor {
    public static async processHarFileStreaming(
        harContent: string,
        config: AnalysisMode.Configuration,
        progressCallback?: (progress: number, stage: string) => void
    ): Promise<HarAnalysisResult> {
        this.validateHarContent(harContent);

        const allEntries: HarEntry[] = [];
        const parser = new StreamingHarParser();

        let parsedSuccessfully = false;
        parser.on('entry', (entry: HarEntry) => {
            allEntries.push(entry);
        });

        parser.on('end', () => {
            parsedSuccessfully = true;
        });

        parser.on('error', (error) => {
            throw new Error(`Failed to parse HAR file: ${error.message}`);
        });

        parser.parse(harContent);

        if (!parsedSuccessfully) {
            throw new Error("Unknown error during HAR parsing.");
        }

        if (allEntries.length === 0) {
            throw new Error("The HAR file is valid, but it contains no network requests.");
        }

        // 1. Contextual Scoring & Filtering
        progressCallback?.(0, 'scoring');
        const scoringService = new EndpointScoringService();
        const analysisContext: Omit<AnalysisContext, 'currentIndex'> = { allEntries, criteria: config.filtering };
        
        const scoredEntries = allEntries.map((entry, index) => scoringService.scoreEntry(entry, { ...analysisContext, currentIndex: index }))
            .filter(entry => entry.finalScore > 0);

        if (scoredEntries.length === 0) {
            throw new Error("No relevant requests found in the HAR file after filtering. Please check the analysis mode configuration or try a different HAR file.");
        }

        progressCallback?.(25, 'token-detection');
        
        const tokenDetector = new ProductionTokenDetector();
        const detectedTokens = await tokenDetector.detectDynamicTokens(scoredEntries);

        progressCallback?.(50, 'code-generation');
        // Placeholder for code generation
        const generatedCode = "Generated LoliCode";

        progressCallback?.(100, 'complete');

        return {
            requests: scoredEntries,
            metrics: {
                totalRequests: allEntries.length,
                significantRequests: scoredEntries.length,
                processingTime: 0, // to be implemented
            },
            loliCode: generatedCode,
            detectedTokens: detectedTokens,
        };
    }

    private static validateHarContent(harContent: string): void {
        if (!harContent.trim()) {
            throw new Error("The HAR file is empty. Please upload a valid HAR file.");
        }
        try {
            const har = JSON.parse(harContent);
            if (!har.log || !Array.isArray(har.log.entries)) {
                throw new Error("Invalid HAR file format. The file must contain a 'log' object with an 'entries' array.");
            }
        } catch (error) {
            throw new Error("Failed to parse HAR file. The file may be malformed or not in valid JSON format.");
        }
    }
}