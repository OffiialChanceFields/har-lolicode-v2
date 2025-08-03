import React, { useState } from 'react';
import { Terminal, Zap, Shield, Code } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { HarUpload } from '@/components/HarUpload';
import { ProcessingPipeline } from '@/components/ProcessingPipeline';
import { CodeOutput } from '@/components/CodeOutput';
import { HarProcessor } from '@/services/HarProcessor';

interface ProcessingState {
  isProcessing: boolean;
  currentStep: number;
  progress: number;
  result: {
    loliCode: string;
    analysis: {
      requestsFound: number;
      tokensDetected: number;
      criticalPath: string[];
    };
  } | null;
  filename: string;
}

const PIPELINE_STEPS = [
  {
    id: 'ingestion',
    title: 'Ingestion & Filtering',
    description: 'Loading HAR file and filtering static resources'
  },
  {
    id: 'analysis',
    title: 'Critical Path Analysis',
    description: 'Identifying key requests using heuristic scoring'
  },
  {
    id: 'dependency',
    title: 'Dependency Mapping',
    description: 'Detecting dynamic tokens and CSRF protection'
  },
  {
    id: 'generation',
    title: 'LoliCode Generation',
    description: 'Converting requests to executable blocks'
  },
  {
    id: 'validation',
    title: 'Output Validation',
    description: 'Verifying syntax and sanitizing data'
  }
];

const Index = () => {
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    currentStep: 0,
    progress: 0,
    result: null,
    filename: ''
  });
  const [targetUrl, setTargetUrl] = useState('');

  const simulateProcessing = async (filename: string, content: string) => {
    setProcessing(prev => ({
      ...prev,
      isProcessing: true,
      filename,
      currentStep: 0,
      progress: 0,
      result: null
    }));
    
    // Simulate processing stages
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setProcessing(prev => ({
        ...prev,
        currentStep: i,
        progress: (i / PIPELINE_STEPS.length) * 80
      }));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    }

    // Actually process the HAR file
    try {
      const result = await HarProcessor.processHarFile(content, targetUrl);
      
      setProcessing(prev => ({
        ...prev,
        progress: 100,
        result,
        isProcessing: false
      }));
    } catch (error) {
      console.error('Processing failed:', error);
      setProcessing(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100
      }));
    }
  };

  const handleFileSelect = (file: File, content: string) => {
    simulateProcessing(file.name, content);
  };

  const resetProcessor = () => {
    setProcessing({
      isProcessing: false,
      currentStep: 0,
      progress: 0,
      result: null,
      filename: ''
    });
    setTargetUrl('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-glow">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg border border-primary/20">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
                  HAR2LoliCode Automator
                </h1>
                <p className="text-muted-foreground mt-1">
                  Production-grade HAR to OpenBullet 2 configuration converter
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-success" />
                <span>Local Processing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-warning" />
                <span>Real-time Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-primary" />
                <span>LoliCode Output</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Pipeline */}
          <div className="lg:col-span-1 space-y-6">
            <HarUpload 
              onFileSelect={handleFileSelect}
              isProcessing={processing.isProcessing}
              targetUrl={targetUrl}
              onTargetUrlChange={setTargetUrl}
            />
            
            {(processing.isProcessing || processing.result) && (
              <ProcessingPipeline
                steps={PIPELINE_STEPS.map((step, index) => ({
                  ...step,
                  status: index < processing.currentStep 
                    ? 'complete' as const
                    : index === processing.currentStep && processing.isProcessing 
                      ? 'processing' as const
                      : 'pending' as const
                }))}
                currentStep={processing.currentStep}
                progress={processing.progress}
              />
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {processing.result ? (
              <div className="space-y-6">
                <CodeOutput
                  loliCode={processing.result.loliCode}
                  analysis={processing.result.analysis}
                  filename={processing.filename}
                />
                
                <div className="flex justify-center">
                  <button
                    onClick={resetProcessor}
                    className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Process Another File
                  </button>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center bg-gradient-glow border-border/50">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Terminal className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Ready for HAR Analysis
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Upload a HAR file to begin automated conversion to OpenBullet 2 LoliCode. 
                      The tool will analyze request patterns, detect dynamic tokens, and generate production-ready configurations.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto text-sm">
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="font-medium text-primary">Advanced Detection</div>
                      <div className="text-muted-foreground">CSRF tokens, multi-step flows</div>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="font-medium text-secondary">Security First</div>
                      <div className="text-muted-foreground">Local processing, no uploads</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
