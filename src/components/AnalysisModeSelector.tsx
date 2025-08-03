import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisMode } from '@/services/AnalysisMode';

interface AnalysisModeSelectorProps {
  selectedMode: AnalysisMode.Predefined;
  onModeChange: (mode: AnalysisMode.Predefined) => void;
}

const modeDetails = {
  [AnalysisMode.Predefined.AUTOMATIC]: {
    title: 'Automatic Mode',
    description: 'Intelligent, adaptive analysis. Best for most use cases.'
  },
  [AnalysisMode.Predefined.ASSISTED]: {
    title: 'Assisted Mode',
    description: 'Balanced approach with guided suggestions. Good for complex flows.'
  },
  [AnalysisMode.Predefined.MANUAL]: {
    title: 'Manual Mode',
    description: 'Full control over the analysis process. For expert users.'
  }
};

export const AnalysisModeSelector: React.FC<AnalysisModeSelectorProps> = ({ selectedMode, onModeChange }) => {
  return (
    <Card className="bg-gradient-glow border-border/50 shadow-elevation">
      <CardHeader>
        <CardTitle>Select Analysis Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMode}
          onValueChange={(value) => onModeChange(value as AnalysisMode.Predefined)}
          className="space-y-4"
        >
          {Object.values(AnalysisMode.Predefined).map((mode) => (
            <Label
              key={mode}
              htmlFor={mode}
              className={`flex items-center p-4 rounded-lg border transition-all cursor-pointer ${selectedMode === mode ? 'bg-primary/20 border-primary/50' : 'border-border/50 hover:bg-muted/50'}`}
            >
              <RadioGroupItem value={mode} id={mode} className="mr-4" />
              <div>
                <span className="font-semibold">{modeDetails[mode].title}</span>
                <p className="text-sm text-muted-foreground">{modeDetails[mode].description}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
