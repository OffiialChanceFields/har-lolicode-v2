// src/hooks/useHarAnalysis.ts

import { useState } from 'react';
import { Har } from '../types';
import { AsyncHarProcessor } from '../core/AsyncHarProcessor';
import { AppError } from '../error-handling/ErrorHandlingFramework';

// Defines the state of the HAR analysis process
export interface HarAnalysisState {
  har: Har | null;
  isLoading: boolean;
  error: AppError | null;
  progress: number;
  status: string;
}

/**
 * Custom hook to manage the HAR file analysis process.
 * It handles the state of the analysis, including loading, errors, progress, and status.
 *
 * @returns The analysis state and a function to start the analysis.
 */
export const useHarAnalysis = (): [HarAnalysisState, (file: File) => void] => {
  const [analysisState, setAnalysisState] = useState<HarAnalysisState>({
    har: null,
    isLoading: false,
    error: null,
    progress: 0,
    status: 'Ready',
  });

  /**
   * Starts the analysis of the provided HAR file.
   * @param file The HAR file to analyze.
   */
  const analyzeHar = (file: File) => {
    setAnalysisState({
      har: null,
      isLoading: true,
      error: null,
      progress: 0,
      status: 'Initializing analysis...',
    });

    const harProcessor = new AsyncHarProcessor(file);

    harProcessor.on('onProgress', (progress) => {
      setAnalysisState((prevState) => ({ ...prevState, progress }));
    });

    harProcessor.on('onStatusUpdate', (status) => {
      setAnalysisState((prevState) => ({ ...prevState, status }));
    });

    harProcessor.on('onError', (error) => {
      setAnalysisState({
        har: null,
        isLoading: false,
        error: error as AppError,
        progress: 0,
        status: 'Analysis failed',
      });
    });

    harProcessor.on('onComplete', (har) => {
      setAnalysisState({
        har,
        isLoading: false,
        error: null,
        progress: 100,
        status: 'Analysis complete',
      });
    });

    harProcessor.process();
  };

  return [analysisState, analyzeHar];
};
