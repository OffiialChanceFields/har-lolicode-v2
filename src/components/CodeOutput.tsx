import React from 'react';
import { Copy, Download, Code2, Check, Zap, FileText, Share2, Package } from 'lucide-react';
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
    matchedPatterns: any[];
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
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(loliCode);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "LoliCode has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([loliCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.har$/, '')}.loli`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 bg-gradient-glow border-border/50 shadow-elevation">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold bg-gradient-cyber bg-clip-text text-transparent flex items-center gap-2">
            <Code2 className="h-6 w-6" />
            Generated Configuration
          </h3>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              className={`border-primary/20 hover:bg-primary/10 hover:border-primary transition-all duration-300 ${copied ? 'bg-success/20 border-success' : ''}`}
            >
              {copied ? <Check className="h-4 w-4 mr-2 text-success animate-pulse" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadConfig}
              className="border-primary/20 hover:bg-primary/10 hover:border-primary transition-glow"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'code' | 'analysis')}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="code">LoliCode Output</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Report</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4">
            <div className="relative bg-code-bg border border-code-border rounded-lg overflow-hidden group">
              <Highlight
                theme={openBulletTheme}
                code={loliCode}
                language="tsx"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={`${className} p-4 pl-12 text-sm font-mono overflow-x-auto max-h-[50vh]`}
                    style={style}
                  >
                    {tokens.map((line, i) => {
                      const { key, ...lineProps } = getLineProps({ line, key: i });
                      return (
                        <div key={key} {...lineProps}>
                          <span className="absolute left-4 text-muted-foreground select-none">{i + 1}</span>
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
                <div className="bg-muted/20 rounded-lg p-4 text-center border border-border/50 transition-glow flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <div className="text-3xl font-bold text-primary">{analysis.requestsFound}</div>
                  <div className="text-sm text-muted-foreground mt-1">Requests Analyzed</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-4 text-center border border-border/50 transition-glow flex flex-col items-center justify-center">
                  <Zap className="h-8 w-8 text-secondary mb-2" />
                  <div className="text-3xl font-bold text-secondary">{analysis.tokensDetected}</div>
                  <div className="text-sm text-muted-foreground mt-1">Dynamic Tokens</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-4 text-center border border-border/50 transition-glow flex flex-col items-center justify-center">
                   <Share2 className="h-8 w-8 text-success mb-2" />
                  <div className="text-3xl font-bold text-success">{analysis.criticalPath.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Critical Steps</div>
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                <h4 className="font-semibold mb-3 text-foreground">Critical Path Identified:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {analysis.criticalPath.map((step, index) => (
                    <li key={index} className="flex items-center gap-3 font-mono">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-sans font-bold">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.matchedPatterns.length > 0 && (
                <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                    <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Detected Behavioral Patterns
                    </h4>
                    <div className="space-y-3">
                        {analysis.matchedPatterns.map((pattern, index) => (
                            <div key={index} className="bg-code-bg/50 p-3 rounded-lg border border-code-border">
                                <p className="font-semibold text-secondary mb-2 capitalize">{pattern.name.replace(/_/g, ' ')}</p>
                                <pre className="p-2 bg-gray-900 text-white rounded-md overflow-x-auto">
                                    <code>
                                        {JSON.stringify(pattern, null, 2)}
                                    </code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
