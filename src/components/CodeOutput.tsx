// src/components/CodeOutput.tsx
import React from 'react';
import { Copy, Download, Code2, Check, Zap, FileText, Share2, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Highlight } from 'prism-react-renderer';
import openBulletTheme from '@/lib/openbullet-theme';
import { HarAnalysisResult } from '@/services/types';

interface CodeOutputProps {
  results: HarAnalysisResult;
  filename?: string;
}

export const CodeOutput: React.FC<CodeOutputProps> = ({ results, filename = 'output.loli' }) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(results.loliCode);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "LoliCode configuration has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadFile = () => {
    const blob = new Blob([results.loliCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `File "${filename}" has been downloaded.`,
    });
  };
  
  const renderTokenTable = () => {
    const tokens = Array.from(results.detectedTokens.values()).flat();
    
    if (tokens.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No tokens detected in the analyzed requests
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Name</th>
              <th className="text-left py-2 px-4">Value</th>
              <th className="text-left py-2 px-4">Type</th>
              <th className="text-left py-2 px-4">Location</th>