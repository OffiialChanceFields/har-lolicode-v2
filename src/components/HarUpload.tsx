import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, FileText, Upload, Link } from "lucide-react";

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
  
    const onDrop = useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.name.endsWith('.har')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            JSON.parse(content); // Validate JSON
            onFileSelect(file, content);
          } catch (error) {
            console.error('Invalid HAR file:', error);
          }
        };
        reader.readAsText(file);
      }
    }, [onFileSelect]);
  
    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
      onDrop,
      accept: {
        'application/json': ['.har']
      },
      multiple: false,
      disabled: isProcessing || !securityWarningAccepted
    });
  
    return (
      <div className="space-y-6">
        {/* Security Warning */}
        {!securityWarningAccepted && (
          <Alert className="border-warning bg-warning/10">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-warning">
                  Security Notice: HAR files contain sensitive data
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Session cookies and authentication tokens</li>
                  <li>• API keys and authorization headers</li>
                  <li>• Personal information submitted in forms</li>
                  <li>• Complete request/response history</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  This tool processes HAR files locally in your browser. No data is transmitted to external servers.
                </p>
                <Button 
                  onClick={() => setSecurityWarningAccepted(true)}
                  variant="outline"
                  size="sm"
                  className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                >
                  I understand and accept
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Target URL Input */}
        {securityWarningAccepted && (
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
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Strictly filters for requests to this domain, improving analysis accuracy.
            </p>
          </Card>
        )}
  
        {/* File Upload Area */}
        <Card className={`border-2 border-dashed transition-all duration-300 ${
          !securityWarningAccepted || !targetUrl
            ? 'opacity-50 cursor-not-allowed' 
            : isDragActive 
              ? 'border-primary bg-primary/5 shadow-glow' 
              : isDragReject 
                ? 'border-destructive bg-destructive/5' 
                : 'border-border hover:border-primary/50'
        }`}>
          <div 
            {...getRootProps()} 
            className="p-8 text-center cursor-pointer"
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                {isProcessing ? (
                  <div className="animate-pulse-glow">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
  
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isProcessing 
                    ? 'Processing HAR file...' 
                    : 'Upload HAR File'
                  }
                </h3>
                
                {!isProcessing && (
                  <p className="text-muted-foreground">
                    {isDragActive 
                      ? 'Drop your HAR file here...' 
                      : 'Drag & drop a .har file here, or click to select'
                    }
                  </p>
                )}
              </div>
  
              {!isProcessing && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Export from Browser DevTools → Network → Save as HAR</p>
                  <p className="text-xs">Supported formats: HAR 1.2 (JSON)</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };
