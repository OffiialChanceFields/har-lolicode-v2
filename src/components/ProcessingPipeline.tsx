
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader, Circle } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  status: 'complete' | 'processing' | 'pending';
}

interface ProcessingPipelineProps {
  steps: Step[];
  currentStep: number;
  progress: number;
}

const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-primary animate-spin" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ steps, currentStep, progress }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center space-x-3">
          <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
                <p className={`font-medium ${step.status !== 'pending' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                </p>
                {step.status === 'complete' && <span className="text-xs text-green-500">100%</span>}
            </div>
            {step.status === 'processing' && (
              <Progress value={progress} className="h-2 mt-1" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
