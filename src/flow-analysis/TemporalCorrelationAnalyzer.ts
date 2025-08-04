// src/flow-analysis/TemporalCorrelationAnalyzer.ts
import { HarEntry } from '../services/types';

export class TemporalCorrelationAnalyzer {
  analyze(requests: HarEntry[]): Map<string, number> {
    const temporalMap = new Map<string, number>();

    // Sort requests by timestamp
    const sortedRequests = [...requests].sort(
      (a, b) =>
        new Date(a.startedDateTime).getTime() -
        new Date(b.startedDateTime).getTime()
    );

    // Analyze temporal relationships
    for (let i = 1; i < sortedRequests.length; i++) {
      const prev = sortedRequests[i - 1];
      const curr = sortedRequests[i];

      const prevTime = new Date(prev.startedDateTime).getTime();
      const currTime = new Date(curr.startedDateTime).getTime();
      const delayMs = currTime - prevTime;

      // Create key for this relationship
      const key = `${prev.request.url}→${curr.request.url}`;
      temporalMap.set(key, delayMs);
    }

    return temporalMap;
  }

  extractDependencyChains(
    requests: HarEntry[],
    correlationMatrix: number[][]
  ): Array<{ start: number; end: number; strength: number }> {
    const chains: Array<{ start: number; end: number; strength: number }> = [];
    const visited = new Set<number>();

    // For each request, find its strongest dependencies
    for (let i = 0; i < requests.length; i++) {
      if (visited.has(i)) continue;

      let current = i;
      const chainStart = i;
      let chainStrength = 1.0;

      // Follow the chain forward
      while (true) {
        visited.add(current);
        let nextIndex = -1;
        let maxCorrelation = 0.7;

        for (let j = 0; j < requests.length; j++) {
          if (j === current || visited.has(j)) continue;

          if (correlationMatrix[current][j] > maxCorrelation) {
            maxCorrelation = correlationMatrix[current][j];
            nextIndex = j;
          }
        }

        if (nextIndex === -1) {
          // Chain ends here
          if (current !== chainStart) {
            chains.push({
              start: chainStart,
              end: current,
              strength: chainStrength
            });
          }
          break;
        }

        // Update chain strength
        chainStrength = Math.min(chainStrength, maxCorrelation);
        current = nextIndex;
      }
    }

    return chains;
  }
}
