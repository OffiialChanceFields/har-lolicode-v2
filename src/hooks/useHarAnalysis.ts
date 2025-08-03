
import { useState, useCallback } from 'react';
import { AnalysisMode } from '../services/AnalysisMode';
import { AsyncHarProcessor } from '../services/AsyncHarProcessor';

interface HarAnalysisResult {
    loliCode: string;
    analysis: {
        requestsFound: number;
        tokensDetected: number;
        criticalPath: string[];
    };
}

interface UseHarAnalysisReturn {
  analyzeHar: (harContent: string, config: AnalysisMode.Configuration) => Promise<HarAnalysisResult | undefined>;
  isLoading: boolean;
  error: Error | null;
  progress: {
      value: number;
      stage: string;
  };
}

export const useHarAnalysis = (): UseHarAnalysisReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({ value: 0, stage: '' });

  const analyzeHar = useCallback(async (harContent: string, config: AnalysisMode.Configuration) => {
    setIsLoading(true);
    setError(null);
    setProgress({ value: 0, stage: 'starting' });

    try {
      const result = await AsyncHarProcessor.processHarFileStreaming(
        harContent,
        config,
        (value, stage) => setProgress({ value, stage })
      );
      setIsLoading(false);
      return result;
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e);
      } else {
        setError(new Error('An unknown error occurred during HAR analysis.'));
      }
      setIsLoading(false);
    }
  }, []);

  return {
    analyzeHar,
    isLoading,
    error,
    progress
  };
};
