import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, FileText, Upload, Link, FileCheck, BrainCircuit, XCircle } from "lucide-react";

interface HarUploadProps {
  onFileSelect: (file: File, content: string) => void;
  isProcessing: boolean;
  targetUrl: string;
  onTargetUrlChange: (url: string) => void;
}

export const HarUpload: React.FC<HarUploadProps> = ({ 
  onFileSelect, 
  isProcessing,
  targetUrl,
  onTargetUrlChange
}) => {
    const [securityWarningAccepted, setSecurityWarningAccepted] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [urlError, setUrlError] = useState<string | null>(null);

    const isValidUrl = useMemo(() => {
      if (!targetUrl) return false;
      try {
        new URL(targetUrl);
        setUrlError(null);
        return true;
      } catch {
        setUrlError("Invalid URL format.");
        return false;
      }
    }, [targetUrl]);
  
    const onDrop = useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.name.endsWith('.har')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            JSON.parse(content);
            setSelectedFile(file);
            setFileContent(content);
          } catch (error) {
            console.error('Invalid HAR file:', error);
            setSelectedFile(null);
            setFileContent(null);
          }
        };
        reader.readAsText(file);
      }
    }, []);

    const handleAnalyze = () => {
      if (selectedFile && fileContent && isValidUrl) {
        onFileSelect(selectedFile, fileContent);
      }
    };
  
    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
      onDrop,
      accept: { 'application/json': ['.har'] },
      multiple: false,
      disabled: isProcessing || !securityWarningAccepted
    });
  
    const isReadyForAnalysis = selectedFile && isValidUrl && !isProcessing;

    return (
      <div className="space-y-6">
        {!securityWarningAccepted && (
           <Alert className="border-warning bg-warning/10">
           <Shield className="h-4 w-4" />
           <AlertDescription>
             <div className="space-y-3">
               <p className="font-medium text-warning">Security Notice: HAR files contain sensitive data</p>
               <ul className="text-sm space-y-1 text-muted-foreground">
                 <li>• Session cookies and authentication tokens</li>
                 <li>• API keys and authorization headers</li>
                 <li>• Personal information submitted in forms</li>
               </ul>
               <p className="text-xs text-muted-foreground">This tool processes HAR files locally. No data is transmitted to external servers.</p>
               <Button onClick={() => setSecurityWarningAccepted(true)} variant="outline" size="sm" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                 I understand and accept
               </Button>
             </div>
           </AlertDescription>
         </Alert>
        )}

        {securityWarningAccepted && (
          <>
            <Card className="p-4">
              <Label htmlFor="target-url" className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Link className="h-4 w-4 text-primary" />
                Target URL
              </Label>
              <Input
                id="target-url"
                type="url"
                placeholder="e.g., https://api.example.com"
                value={targetUrl}
                onChange={(e) => onTargetUrlChange(e.target.value)}
                disabled={isProcessing}
                className={`bg-background ${urlError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {urlError && <p className="text-xs text-destructive mt-2 flex items-center gap-1"><XCircle className="h-3 w-3"/>{urlError}</p>}
              {!urlError && <p className="text-xs text-muted-foreground mt-2">Required for accurate request filtering.</p>}
            </Card>

            <Card className={`border-2 border-dashed transition-all duration-300 ${
              isDragActive ? 'border-primary bg-primary/5 shadow-glow' : 'border-border hover:border-primary/50'
            }`}>
              <div {...getRootProps()} className="p-8 text-center cursor-pointer">
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {selectedFile ? (
                      <FileCheck className="h-12 w-12 text-success animate-pulse-glow" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {selectedFile ? selectedFile.name : 'Upload HAR File'}
                    </h3>
                    {!selectedFile && (
                      <p className="text-muted-foreground">
                        {isDragActive ? 'Drop your HAR file here...' : 'Drag & drop a .har file, or click to select'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleAnalyze}
              disabled={!isReadyForAnalysis}
              className="w-full text-lg py-6 bg-gradient-cyber text-primary-foreground font-bold transition-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BrainCircuit className="h-5 w-5 mr-2" />
              {isProcessing ? 'Analyzing...' : 'Start Analysis'}
            </Button>
          </>
        )}
      </div>
    );
  };
