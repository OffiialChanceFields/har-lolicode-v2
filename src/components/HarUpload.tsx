import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileCheck, BrainCircuit, Eye } from "lucide-react";
import { JsonViewerModal } from "./JsonViewerModal";

interface HarUploadProps {
  onFileSelect: (file: File, content: string) => void;
  isProcessing: boolean;
}

export const HarUpload: React.FC<HarUploadProps> = ({ 
  onFileSelect, 
  isProcessing,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

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
      disabled: isProcessing
    });
  
    const isReadyForAnalysis = selectedFile && !isProcessing;

    return (
      <div className="space-y-6">
        <JsonViewerModal isOpen={isJsonModalOpen} onClose={() => setIsJsonModalOpen(false)} json={harJson} title={selectedFile?.name || "HAR File"} />
        
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
      </div>
    );
  };
