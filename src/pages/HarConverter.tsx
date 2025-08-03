
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useHarAnalysis } from "@/hooks/useHarAnalysis";
import { AnalysisMode } from "@/services/AnalysisMode";
import { Progress } from "@/components/ui/progress";
import { CodeOutput } from "@/components/CodeOutput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const HarUploader = ({ onFileUpload, disabled }) => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileUpload(e.target.result as string, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-300 ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle>HAR File Upload</CardTitle>
        <CardDescription>Select a .har file to begin the automated analysis and code generation.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">Drag & drop your HAR file here</p>
          <p className="text-gray-500 mb-4">or</p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".har"
            disabled={disabled}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            Browse Files
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default function HarConverter() {
    const [harContent, setHarContent] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const { analyzeHar, isLoading, error, progress } = useHarAnalysis();
    const [fileName, setFileName] = useState<string>("");

    const handleFileUpload = (content: string, name: string) => {
        setHarContent(content);
        setFileName(name);
        setAnalysisResult(null);
    };

    const handleAnalyze = async () => {
        if (!harContent) return;

        const config: AnalysisMode.Configuration = {
            mode: AnalysisMode.Predefined.AUTOMATIC,
            filtering: {
                endpointPatterns: {
                    include: [],
                    exclude: [/google-analytics.com/, /_next\/static/, /\.css$/, /\.js$/, /\.svg$/, /\.png$/, /\.jpg$/, /\.woff2$/],
                    priorityPatterns: [{ pattern: /api/, weight: 20 }]
                },
                resourceTypeWeights: new Map([
                    [AnalysisMode.ResourceType.API_ENDPOINT, 30],
                    [AnalysisMode.ResourceType.FORM_SUBMISSION, 40],
                    [AnalysisMode.ResourceType.STATIC_ASSET, -50]
                ]),
                contextualRules: [],
                behavioralPatterns: [],
                scoreThresholds: {
                    minimum: 20,
                    optimal: 70,
                    includeThreshold: 25
                }
            },
            tokenDetection: {
                scope: AnalysisMode.TokenDetectionScope.COMPREHENSIVE_SCAN
            },
            codeGeneration: {
                template: AnalysisMode.CodeTemplateType.GENERIC_TEMPLATE,
                includeComments: true
            }
        };
        
        const result = await analyzeHar(harContent, config);
        if(result) {
            setAnalysisResult(result);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-800">
                        Intelligent HAR Analyzer
                    </h1>
                    <p className="mt-4 text-lg text-gray-600">
                        Automatically analyze HAR files, identify critical API calls, and generate LoliCode scripts.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <HarUploader onFileUpload={handleFileUpload} disabled={isLoading} />
                    <div className="flex flex-col items-center justify-center h-full">
                        {fileName && <p className="mb-4 text-lg text-gray-600">Selected file: <span className="font-semibold">{fileName}</span></p>}
                        <Button onClick={handleAnalyze} disabled={!harContent || isLoading} size="lg">
                            {isLoading ? 'Analyzing...' : 'Start Analysis'}
                        </Button>
                    </div>
                </div>

                {isLoading && (
                    <div className="mt-8">
                        <Progress value={progress.value} className="w-full" />
                        <p className="text-center mt-2 text-sm text-gray-600">Analyzing <span className="font-semibold">{fileName}</span>: {progress.stage}...</p>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive" className="mt-8">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Analysis Failed</AlertTitle>
                        <AlertDescription>
                            {error.message}
                        </AlertDescription>
                    </Alert>
                )}

                {analysisResult && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-800">Analysis Complete</h2>
                        <p className="mt-2 text-gray-600">LoliCode has been generated based on the most critical requests found in <span className="font-semibold">{fileName}</span>.</p>
                        <div className="mt-6">
                            <CodeOutput loliCode={analysisResult.loliCode} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
