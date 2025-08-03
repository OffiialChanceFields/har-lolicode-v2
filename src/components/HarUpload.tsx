import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Upload, FileCheck, BrainCircuit, XCircle, Eye, Globe, CheckCircle, Settings, Info, Badge } from "lucide-react";
import { JsonViewerModal } from "./JsonViewerModal";
import { AnalysisMode, AnalysisModeRegistry } from "@/services/AnalysisMode";
import { useHarAnalysis } from "@/hooks/useHarAnalysis";

interface HarUploadProps {
  onFileSelect: (file: File, content: string) => void;
  isProcessing: boolean;
}

const AnalysisModePreview: React.FC<{ mode: AnalysisMode }> = ({ mode }) => {
    const configuration = AnalysisModeRegistry.getConfiguration(mode);
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-muted-foreground">Scoring:</span><div className="font-mono text-primary">{configuration.scoringStrategy}</div></div>
          <div><span className="text-muted-foreground">Performance:</span><div className="font-mono text-secondary">{configuration.performanceProfile}</div></div>
        </div>
        <div><span className="text-muted-foreground">Token Scope:</span><div className="font-mono text-success">{configuration.tokenDetectionScope}</div></div>
        <div><span className="text-muted-foreground">Template:</span><div className="font-mono text-warning">{configuration.codeGenerationTemplate}</div></div>
      </div>
    );
};

const AnalysisModeSelect: React.FC<{
    selectedMode: AnalysisMode;
    onModeChange: (mode: AnalysisMode) => void;
    disabled?: boolean;
}> = ({ selectedMode, onModeChange, disabled = false }) => {
    const analysisModeOptions = [
        { value: AnalysisMode.INITIAL_PAGE_LOAD, label: 'Initial Page Load', icon: Globe, complexity: 'Low', useCase: 'CSRF token extraction' },
        { value: AnalysisMode.FAILED_AUTHENTICATION, label: 'Failed Authentication', icon: XCircle, complexity: 'Medium', useCase: 'Error handling patterns' },
        { value: AnalysisMode.SUCCESSFUL_AUTHENTICATION, label: 'Successful Authentication', icon: CheckCircle, complexity: 'High', useCase: 'Full login flows' },
        { value: AnalysisMode.COMPREHENSIVE_FLOW, label: 'Comprehensive Analysis', icon: BrainCircuit, complexity: 'High', useCase: 'Unknown authentication patterns' }
    ];

    return (
        <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-primary" /><Label className="text-sm font-medium">Analysis Mode</Label>
            </div>
            <Select value={selectedMode} onValueChange={(v: AnalysisMode) => onModeChange(v)} disabled={disabled}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select analysis focus..." /></SelectTrigger>
                <SelectContent>
                    {analysisModeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            <div className="flex items-start gap-3 py-2">
                                <o.icon className="h-4 w-4 mt-0.5 text-primary" />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{o.label}</span>
                                        <Badge variant={o.complexity === 'Low' ? 'secondary' : o.complexity === 'Medium' ? 'default' : 'destructive'} className="text-xs">{o.complexity}</Badge>
                                    </div>
                                    <p className="text-xs text-primary font-medium">Best for: {o.useCase}</p>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {selectedMode && (
                <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-2 mb-2"><Info className="h-3 w-3 text-primary" /><span className="text-xs font-medium text-primary">Mode Configuration</span></div>
                    <AnalysisModePreview mode={selectedMode} />
                </div>
            )}
        </Card>
    );
};


export const HarUpload: React.FC<HarUploadProps> = ({ 
  onFileSelect, 
  isProcessing,
}) => {
    const [securityWarningAccepted, setSecurityWarningAccepted] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const { analysisMode, setAnalysisMode } = useHarAnalysis(AnalysisMode.SUCCESSFUL_AUTHENTICATION);

    const harJson = useMemo(() => {
        if (!fileContent) return {};
        try { return JSON.parse(fileContent); } catch { return { error: "Failed to parse HAR." }; }
    }, [fileContent]);

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
      if (selectedFile && fileContent) {
        onFileSelect(selectedFile, fileContent);
      }
    };
  
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'application/json': ['.har'] },
      multiple: false,
      disabled: isProcessing || !securityWarningAccepted
    });
  
    const isReadyForAnalysis = selectedFile && !isProcessing;

    return (
      <div className="space-y-6">
        <JsonViewerModal isOpen={isJsonModalOpen} onClose={() => setIsJsonModalOpen(false)} json={harJson} title={selectedFile?.name || "HAR File"} />
        
        {securityWarningAccepted && (
          <>
            <AnalysisModeSelect selectedMode={analysisMode} onModeChange={setAnalysisMode} disabled={isProcessing} />

            <Card className={`border-2 border-dashed transition-all duration-300 ${isDragActive ? 'border-primary bg-primary/5 shadow-glow' : 'border-border hover:border-primary/50'}`}>
              <div {...getRootProps()} className="p-8 text-center cursor-pointer">
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="flex justify-center">{selectedFile ? <FileCheck className="h-12 w-12 text-success animate-pulse-glow" /> : <Upload className="h-12 w-12 text-muted-foreground" />}</div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{selectedFile ? selectedFile.name : 'Upload HAR File'}</h3>
                    {!selectedFile && <p className="text-muted-foreground">{isDragActive ? 'Drop file here...' : 'Drag & drop or click to select'}</p>}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
                <Button onClick={handleAnalyze} disabled={!isReadyForAnalysis} className="w-full text-lg py-6 bg-gradient-cyber text-primary-foreground font-bold transition-glow disabled:opacity-50"><BrainCircuit className="h-5 w-5 mr-2" />{isProcessing ? 'Analyzing...' : 'Start Analysis'}</Button>
                <Button onClick={() => setIsJsonModalOpen(true)} disabled={!selectedFile} variant="outline" className="py-6 transition-glow"><Eye className="h-5 w-5" /></Button>
            </div>
          </>
        )}
      </div>
    );
  };
