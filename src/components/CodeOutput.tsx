import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Clipboard } from 'lucide-react';
import { toast } from "sonner";

interface AnalysisDetails {
  requestsFound: number;
  tokensDetected: number;
  criticalPath: string[];
  matchedPatterns: Record<string, unknown>[];
}

interface AnalysisResult {
  loliCode: string;
  analysis: AnalysisDetails;
}

interface CodeOutputProps {
  analysisResult: AnalysisResult;
  filename: string;
}

export const CodeOutput: React.FC<CodeOutputProps> = ({ analysisResult, filename }) => {
  if (!analysisResult) {
    return null;
  }

  const { loliCode, analysis } = analysisResult;

  const handleCopy = () => {
    navigator.clipboard.writeText(loliCode);
    toast.success("LoliCode copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([loliCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.har', '')}.loli`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-gradient-glow border-border/50 shadow-elevation">
      <Tabs defaultValue="code">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <TabsList>
            <TabsTrigger value="code">LoliCode</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleCopy}><Clipboard className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}><Download className="h-4 w-4" /></Button>
          </div>
        </div>
        <TabsContent value="code">
          <SyntaxHighlighter language="loli" style={oneDark} customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem' }}>
            {loliCode}
          </SyntaxHighlighter>
        </TabsContent>
        <TabsContent value="analysis" className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Metrics</CardTitle></CardHeader>
              <CardContent>
                <p>Requests Found: {analysis.requestsFound}</p>
                <p>Tokens Detected: {analysis.tokensDetected}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Critical Path</CardTitle></CardHeader>
              <CardContent className="text-sm overflow-auto max-h-40">
                <ul className="list-disc pl-5">
                  {analysis.criticalPath.map((url, i) => <li key={i} className="truncate">{url}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
