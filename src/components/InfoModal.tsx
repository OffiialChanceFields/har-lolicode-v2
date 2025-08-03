
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, UploadCloud, Zap, Code } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-glow border-border/50 shadow-lg">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">How it Works</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-base">
            This tool automates the conversion of HAR files into executable LoliCode for OpenBullet 2.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
            <UploadCloud className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-semibold mb-1">1. Upload HAR File</h3>
            <p className="text-sm text-muted-foreground">Select a HAR file from your browser's network inspector.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
            <Zap className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-semibold mb-1">2. Automated Analysis</h3>
            <p className="text-sm text-muted-foreground">The tool filters, scores, and identifies the critical user flow.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
            <Code className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-semibold mb-1">3. Get LoliCode</h3>
            <p className="text-sm text-muted-foreground">Receive optimized LoliCode ready for use in OpenBullet 2.</p>
          </div>
        </div>
        
        <div className="text-center">
          <Button onClick={onClose} className="px-6 transition-glow">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
