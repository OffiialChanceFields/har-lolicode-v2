import React from 'react';
import { Copy, Download, Code2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Highlight } from 'prism-react-renderer';
import openBulletTheme from '@/lib/openbullet-theme';

interface CodeOutputProps {
  loliCode: string;
  analysis: {
    requestsFound: number;
    tokensDetected: number;
    criticalPath: string[];
  };
  filename: string;
}

export const CodeOutput: React.FC<CodeOutputProps> = ({ 
  loliCode, 
  analysis, 
  filename 
}) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = React.useState<'code' | 'analysis'>('code');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(loliCode);
      toast({
        title: "Copied to clipboard",
        description: "LoliCode has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadConfig = () => {
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
    <Card className="p-6 bg-gradient-glow border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Generated Configuration
          </h3>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              className="border-primary/20 hover:border-primary"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadConfig}
              className="border-primary/20 hover:border-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'code' | 'analysis')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">LoliCode Output</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Report</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4">
            <div className="relative bg-code-bg border border-code-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-black/20">
                <span className="text-sm font-medium text-muted-foreground">LoliCode</span>
              </div>
              <Highlight
                theme={openBulletTheme}
                code={loliCode}
                language="tsx"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={`${className} p-4 text-sm font-mono overflow-x-auto max-h-96`}
                    style={style}
                  >
                    {tokens.map((line, i) => {
                      const { key, ...lineProps } = getLineProps({ line, key: i });
                      return (
                        <div key={key} {...lineProps}>
                          {line.map((token, key) => {
                            const { key: tokenKey, ...tokenProps } = getTokenProps({ token, key });
                            return <span key={tokenKey} {...tokenProps} />
                          })}
                        </div>
                      );
                    })}
                  </pre>
                )}
              </Highlight>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.requestsFound}</div>
                  <div className="text-sm text-muted-foreground">Requests Analyzed</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">{analysis.tokensDetected}</div>
                  <div className="text-sm text-muted-foreground">Dynamic Tokens</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-success">{analysis.criticalPath.length}</div>
                  <div className="text-sm text-muted-foreground">Critical Steps</div>
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium mb-2">Critical Path Identified:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {analysis.criticalPath.map((step, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-primary font-mono">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
