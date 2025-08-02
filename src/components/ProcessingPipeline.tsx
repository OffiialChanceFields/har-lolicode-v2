import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

interface ProcessingPipelineProps {
  steps: PipelineStep[];
  currentStep: number;
  progress: number;
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ 
  steps, 
  currentStep, 
  progress 
}) => {
  return (
    <Card className="p-6 bg-gradient-glow border-border/50">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Conversion Pipeline
          </h3>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-primary/10 border border-primary/20' 
                  : index < currentStep 
                    ? 'bg-success/10' 
                    : 'bg-muted/20'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'processing' ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : step.status === 'complete' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : step.status === 'error' ? (
                  <Circle className="h-5 w-5 text-destructive" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${
                  step.status === 'complete' 
                    ? 'text-success' 
                    : step.status === 'processing' 
                      ? 'text-primary' 
                      : 'text-foreground'
                }`}>
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>

              <div className="flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  step.status === 'complete' 
                    ? 'bg-success/20 text-success' 
                    : step.status === 'processing' 
                      ? 'bg-primary/20 text-primary' 
                      : step.status === 'error'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                }`}>
                  Stage {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};