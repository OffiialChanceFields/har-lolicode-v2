import { HarEntry, OB2BlockDefinition } from '../services/types';
import { PatternMatch } from '../flow-analysis/BehavioralPatternMatcher';

export class BlockOptimizer {
    optimizeBlockSequence(
        requests: HarEntry[],
        patternMatches: PatternMatch[],
        templateType: string
    ): OB2BlockDefinition[] {
        const primaryPattern = patternMatches.length > 0 ? patternMatches[0] : null;

        // Previously, logic was in optimizeBlocks. This preserves that intent:
        if (primaryPattern) {
            if (primaryPattern.type === "auth-success") {
                return this.createAuthSuccessTemplate(requests, primaryPattern);
            } else if (primaryPattern.type === "pattern-auth") {
                return this.createPatternBasedAuthTemplate(requests, primaryPattern);
            } else if (primaryPattern.type === "multi-step") {
                return this.createMultiStepFlowTemplate(requests, patternMatches);
            }
        }
        return [];
    }

    createAuthSuccessTemplate(
        requests: HarEntry[],
        primaryPattern: PatternMatch | null
    ): OB2BlockDefinition[] {
        if (!primaryPattern) {
            return [];
        }
        // Preserved logic, mapped to OB2BlockDefinition
        return [
            {
                type: 'Auth',
                data: {
                    result: primaryPattern.result,
                    authType: primaryPattern.authType,
                    details: primaryPattern.details
                }
            },
            {
                type: 'Success',
                data: {
                    message: "Authentication succeeded"
                }
            }
        ];
    }

    createPatternBasedAuthTemplate(
        requests: HarEntry[],
        pattern: PatternMatch
    ): OB2BlockDefinition[] {
        return [
            {
                type: 'Auth',
                data: {
                    pattern: pattern.pattern,
                    authType: pattern.authType,
                    details: pattern.details
                }
            },
            {
                type: 'Success',
                data: {
                    message: "Pattern-based authentication succeeded"
                }
            }
        ];
    }

    createMultiStepFlowTemplate(
        requests: HarEntry[],
        patternMatches: PatternMatch[]
    ): OB2BlockDefinition[] {
        // Example logic: use descriptions from patternMatches
        const steps = (patternMatches[0]?.stepDescriptions || []).map((desc, i) => ({
            type: 'Step',
            data: {
                step: i + 1,
                description: desc || `Step ${i + 1}`
            }
        }));
        return [
            ...steps,
            {
                type: 'Success',
                data: {
                    message: "Multi-step flow completed"
                }
            }
        ];
    }
}