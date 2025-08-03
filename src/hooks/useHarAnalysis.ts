// src/hooks/useHarAnalysis.ts
import { useState, useCallback } from 'react';
import { AnalysisMode, AnalysisModeRegistry, AnalysisModeConfiguration } from '../services/AnalysisMode';

interface UseHarAnalysisReturn {
  analysisMode: AnalysisMode;
  setAnalysisMode: (mode: AnalysisMode) => void;
  getConfiguration: () => AnalysisModeConfiguration;
  isLoading: boolean;
  error: Error | null;
}

export const useHarAnalysis = (initialMode: AnalysisMode = AnalysisMode.INITIAL_PAGE_LOAD): UseHarAnalysisReturn => {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(initialMode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const getConfiguration = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const config = AnalysisModeRegistry.getConfiguration(analysisMode);
      setIsLoading(false);
      return config;
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e);
      } else {
        setError(new Error('An unknown error occurred'));
      }
      setIsLoading(false);
      throw e;
    }
  }, [analysisMode]);

  return {
    analysisMode,
    setAnalysisMode,
    getConfiguration,
    isLoading,
    error,
  };
};
