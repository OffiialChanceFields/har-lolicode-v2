import { HarEntry, OB2BlockDefinition, BehavioralFlow } from '../types';

// BlockOptimizer: Optimizes a BehavioralFlow (sequence of OB2BlockDefinition) for compliance and performance.
// The optimizer merges adjacent compatible blocks, flattens unnecessary nesting, and consolidates similar operations.
// It also attempts to eliminate redundant or no-op blocks while preserving semantic correctness for browser automation flows.

export class BlockOptimizer {
    private originalFlow: BehavioralFlow;
    private optimizedFlow: BehavioralFlow;
    private harEntries: HarEntry[];

    constructor(flow: BehavioralFlow, harEntries: HarEntry[] = []) {
        // Defensive clone to avoid mutating the input
        this.originalFlow = JSON.parse(JSON.stringify(flow));
        this.harEntries = harEntries;
        this.optimizedFlow = {
            ...this.originalFlow,
            blocks: []
        };
    }

    // Entry point: returns a new optimized BehavioralFlow
    optimize(): BehavioralFlow {
        // Step 1: Flatten nested blocks, remove empty/nop blocks
        const flattened = this.flattenBlocks(this.originalFlow.blocks);

        // Step 2: Merge adjacent compatible blocks (e.g., consecutive 'click' or 'type' with same selector)
        const merged = this.mergeAdjacentBlocks(flattened);

        // Step 3: Remove redundant waits, unnecessary navigation, etc.
        const cleaned = this.removeRedundantBlocks(merged);

        // Step 4: Other compliance/performance optimizations (future extension point)

        // Assign optimized blocks
        this.optimizedFlow.blocks = cleaned;

        return this.optimizedFlow;
    }

    // Flattens nested block arrays, removes empty/nop blocks, preserves order
    private flattenBlocks(blocks: OB2BlockDefinition[]): OB2BlockDefinition[] {
        const result: OB2BlockDefinition[] = [];
        for (const block of blocks) {
            if (block == null) continue;
            // If block is a "group" or "sequence" with nested blocks, flatten them
            if (block.type === 'group' || block.type === 'sequence') {
                const innerBlocks = (block as any).blocks;
                if (Array.isArray(innerBlocks)) {
                    // Recursively flatten inner blocks
                    result.push(...this.flattenBlocks(innerBlocks));
                    continue;
                }
            }
            // Remove blocks with no operation (e.g., comment, empty string, or explicit nop)
            if (block.type === 'comment' || block.type === 'nop' || !block.type) continue;
            result.push(block);
        }
        return result;
    }

    // Merges adjacent blocks of the same type and compatible selectors/params (e.g., consecutive 'type' into a single input)
    private mergeAdjacentBlocks(blocks: OB2BlockDefinition[]): OB2BlockDefinition[] {
        if (blocks.length === 0) return [];
        const merged: OB2BlockDefinition[] = [];
        let i = 0;
        while (i < blocks.length) {
            const current = blocks[i];
            // Try to merge with the next block if possible
            if (i + 1 < blocks.length && this.canMerge(current, blocks[i + 1])) {
                const toMerge = [current];
                let j = i + 1;
                while (j < blocks.length && this.canMerge(current, blocks[j])) {
                    toMerge.push(blocks[j]);
                    j++;
                }
                merged.push(this.mergeBlocks(toMerge));
                i = j;
            } else {
                merged.push(current);
                i++;
            }
        }
        return merged;
    }

    // Determines if two blocks are mergeable (e.g., consecutive 'type' to same selector)
    private canMerge(a: OB2BlockDefinition, b: OB2BlockDefinition): boolean {
        if (!a || !b) return false;
        if (a.type !== b.type) return false;
        // Mergeable actions: 'type', 'click', 'waitForSelector', 'assert'
        switch (a.type) {
            case 'type':
                // Can merge if same selector and both have 'value'
                return a.selector === b.selector && !!a.value && !!b.value;
            case 'click':
                // Merge clicks only if both are on the same selector and non-special
                return a.selector === b.selector && !a.options && !b.options;
            case 'waitForSelector':
                return a.selector === b.selector;
            case 'assert':
                return a.selector === b.selector && a.assertion === b.assertion;
            default:
                return false;
        }
    }

    // Merges an array of compatible blocks into one.
    private mergeBlocks(blocks: OB2BlockDefinition[]): OB2BlockDefinition {
        if (blocks.length === 0) throw new Error("mergeBlocks called with empty array");
        // All blocks have the same type (checked before calling)
        const type = blocks[0].type;
        switch (type) {
            case 'type': {
                // Concatenate values into one input
                const selector = blocks[0].selector;
                const value = blocks.map(b => b.value || '').join('');
                // Merge delay if all are the same, else drop
                const delay = blocks.every(b => b.delay === blocks[0].delay) ? blocks[0].delay : undefined;
                return { type, selector, value, ...(delay !== undefined ? { delay } : {}) };
            }
            case 'click': {
                const selector = blocks[0].selector;
                // No options supported for merged clicks
                return { type, selector };
            }
            case 'waitForSelector': {
                const selector = blocks[0].selector;
                // Merge timeout if same, else drop
                const timeout = blocks.every(b => b.timeout === blocks[0].timeout) ? blocks[0].timeout : undefined;
                return { type, selector, ...(timeout !== undefined ? { timeout } : {}) };
            }
            case 'assert': {
                const selector = blocks[0].selector;
                const assertion = blocks[0].assertion;
                return { type, selector, assertion };
            }
            default:
                // Fallback: return first block
                return blocks[0];
        }
    }

    // Remove redundant blocks: consecutive identical waits, unnecessary navigation, etc.
    private removeRedundantBlocks(blocks: OB2BlockDefinition[]): OB2BlockDefinition[] {
        const result: OB2BlockDefinition[] = [];
        let prev: OB2BlockDefinition | undefined;
        for (const block of blocks) {
            // Remove consecutive identical waits (selector or timeout)
            if (
                prev &&
                block.type === 'waitForSelector' &&
                prev.type === 'waitForSelector' &&
                block.selector === prev.selector &&
                block.timeout === prev.timeout
            ) {
                continue;
            }
            // Remove navigation to same URL as previous navigation
            if (
                prev &&
                block.type === 'goto' &&
                prev.type === 'goto' &&
                block.url === prev.url
            ) {
                continue;
            }
            // Remove type of empty string (unless it has a delay)
            if (block.type === 'type' && (!block.value || block.value === '') && !block.delay) {
                continue;
            }
            result.push(block);
            prev = block;
        }
        return result;
    }

    // ---- Optional: More advanced optimizations (future extension) ----

    // Example: Use HAR entries to optimize navigation and waits (not implemented in this version)
    /*
    private optimizeWithHar(blocks: OB2BlockDefinition[], harEntries: HarEntry[]): OB2BlockDefinition[] {
        // Potentially use HAR info to optimize waits, navigation, resource loading, etc.
        // For now, this is a stub for future development.
        return blocks;
    }
    */

    // Example: Group related assertions or actions for performance
    /*
    private groupAssertions(blocks: OB2BlockDefinition[]): OB2BlockDefinition[] {
        // Combine adjacent assertions into a single block if possible
        return blocks;
    }
    */

    // ---- Utility functions ----

    // For testing: pretty-print a block sequence
    static stringifyBlocks(blocks: OB2BlockDefinition[]): string {
        return blocks
            .map(b => {
                switch (b.type) {
                    case 'type':
                        return `type "${b.value}" into ${b.selector}`;
                    case 'click':
                        return `click ${b.selector}`;
                    case 'waitForSelector':
                        return `waitForSelector ${b.selector} (${b.timeout ?? 'default'} ms)`;
                    case 'goto':
                        return `goto ${b.url}`;
                    case 'assert':
                        return `assert ${b.assertion} on ${b.selector}`;
                    default:
                        return b.type;
                }
            })
            .join(' -> ');
    }
}

// Example usage (for test/dev)
// import { OB2BlockDefinition, BehavioralFlow } from '../types';
// const flow: BehavioralFlow = { blocks: [ ... ] };
// const optimizer = new BlockOptimizer(flow);
// const optimized = optimizer.optimize();
// console.log(BlockOptimizer.stringifyBlocks(optimized.blocks));