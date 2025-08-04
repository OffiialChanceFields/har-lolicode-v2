// src/components/HarUpload.tsx

import React from 'react';
import { useHarAnalysis } from '../hooks/useHarAnalysis';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export const HarUpload: React.FC = () => {
  const [analysisState, analyzeHar] = useHarAnalysis();
  const { isLoading, error, progress, status, har } = analysisState;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeHar(file);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Upload HAR File</h2>
      <input type="file" accept=".har" onChange={handleFileChange} disabled={isLoading} />
      
      {isLoading && (
        <div className="mt-4">
          <p className="mb-2">{status}</p>
          <Progress value={progress} />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>{error.name}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {har && !isLoading && (
        <div className="mt-4">
          <Alert>
            <AlertTitle>Analysis Complete</AlertTitle>
            <AlertDescription>
              Successfully processed {har.log.entries.length} requests.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
