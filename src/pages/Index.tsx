import React, { useState } from 'react';
import { Terminal, Zap, Shield, Code, UploadCloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { HarUpload } from '@/components/HarUpload';
import { ProcessingPipeline } from '@/components/ProcessingPipeline';
import { CodeOutput } from '@/components/CodeOutput';
import { HarProcessor } from '@/services/HarProcessor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
    id: 'filtering',
    title: 'Domain Filtering',
    description: 'Isolating requests to the target domain'
  },
  {
    id: 'ingestion',
    title: 'Static Resource Removal',
    description: 'Filtering out non-essential assets (CSS, images)'
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
  const { toast } = useToast();

  const handleProcessing = async (file: File, content: string) => {
    setProcessing({
      isProcessing: true,
      filename: file.name,
      currentStep: 0,
      progress: 0,
      result: null
    });

    const updateProgress = (step: number) => {
      setProcessing(prev => ({
        ...prev,
        currentStep: step,
        progress: ((step + 1) / PIPELINE_STEPS.length) * 100
      }));
    };

    try {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        updateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      }
      const result = await HarProcessor.processHarFile(content, targetUrl);
      setProcessing(prev => ({ ...prev, result, isProcessing: false }));
    } catch (error: any) {
      console.error('Processing failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive"
      });
      setProcessing(prev => ({ ...prev, isProcessing: false, progress: 0, currentStep: 0 }));
    }
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
      <header className="border-b border-border/50 bg-gradient-glow sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg border border-primary/20">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
                HAR2LoliCode
              </h1>
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
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <HarUpload 
              onFileSelect={handleProcessing}
              isProcessing={processing.isProcessing}
              targetUrl={targetUrl}
              onTargetUrlChange={setTargetUrl}
            />
            
            {(processing.isProcessing || processing.result) && (
              <ProcessingPipeline
                steps={PIPELINE_STEPS.map((step, index) => ({
                  ...step,
                  status: index < processing.currentStep 
                    ? 'complete'
                    : index === processing.currentStep && processing.isProcessing 
                      ? 'processing'
                      : 'pending'
                }))}
                currentStep={processing.currentStep}
                progress={processing.progress}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            {processing.result ? (
              <div className="space-y-6">
                <CodeOutput
                  loliCode={processing.result.loliCode}
                  analysis={processing.result.analysis}
                  filename={processing.filename}
                />
                
                <div className="flex justify-center">
                  <Button
                    onClick={resetProcessor}
                    className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-glow"
                  >
                    Process Another File
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center bg-gradient-glow border-border/50 flex flex-col items-center justify-center h-full shadow-elevation">
                <div className="animate-pulse-glow mb-6">
                  <UploadCloud className="h-20 w-20 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Upload a HAR file and provide a target URL to begin the automated conversion to OpenBullet 2 LoliCode.
                </p>
                <div className="flex gap-4 text-sm">
                    <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
                      <div className="font-medium text-primary">Advanced Detection</div>
                      <div className="text-muted-foreground">CSRF, Dynamic Tokens</div>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
                      <div className="font-medium text-secondary">Secure by Design</div>
                      <div className="text-muted-foreground">100% Local Processing</div>
                    </div>
                  </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
