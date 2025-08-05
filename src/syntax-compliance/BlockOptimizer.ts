import { PatternMatch } from "./PatternMatch";
// Removed unused import: import { BehavioralFlow } from "./BehavioralFlow";
import { Block, BlockType } from "./Block";

export class BlockOptimizer {
    static createAuthSuccessTemplate(patternMatch: PatternMatch | null): Block[] {
        if (!patternMatch) {
            return [];
        }
        // Build blocks based on PatternMatch details
        return [
            {
                type: BlockType.Auth,
                data: {
                    result: patternMatch.result,
                    authType: patternMatch.authType,
                    details: patternMatch.details
                }
            },
            {
                type: BlockType.Success,
                data: {
                    message: "Authentication succeeded"
                }
            }
        ];
    }

    static createPatternBasedAuthTemplate(patternMatch: PatternMatch): Block[] {
        // Generates blocks for pattern-based authentication using PatternMatch
        return [
            {
                type: BlockType.Auth,
                data: {
                    pattern: patternMatch.pattern,
                    authType: patternMatch.authType,
                    details: patternMatch.details
                }
            },
            {
                type: BlockType.Success,
                data: {
                    message: "Pattern-based authentication succeeded"
                }
            }
        ];
    }

    static createMultiStepFlowTemplate(patternMatch: PatternMatch): Block[] {
        // Generates blocks for multi-step flows using PatternMatch
        return [
            {
                type: BlockType.Step,
                data: {
                    step: 1,
                    description: patternMatch.stepDescriptions?.[0] || "Step 1"
                }
            },
            {
                type: BlockType.Step,
                data: {
                    step: 2,
                    description: patternMatch.stepDescriptions?.[1] || "Step 2"
                }
            },
            {
                type: BlockType.Success,
                data: {
                    message: "Multi-step flow completed"
                }
            }
        ];
    }

    static optimizeBlocks(blocks: Block[], patternMatch: PatternMatch | null): Block[] {
        if (!patternMatch) return blocks;

        // Example optimization logic using PatternMatch
        if (patternMatch.type === "auth-success") {
            return this.createAuthSuccessTemplate(patternMatch);
        } else if (patternMatch.type === "pattern-auth") {
            return this.createPatternBasedAuthTemplate(patternMatch);
        } else if (patternMatch.type === "multi-step") {
            return this.createMultiStepFlowTemplate(patternMatch);
        }

        return blocks;
    }
}