import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // This is a simple reset. For a real app, you might want to reload the page
    // or navigate to the home page.
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8">
          <div className="text-center bg-gradient-glow border border-destructive/50 p-10 rounded-lg shadow-elevation">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold text-destructive mb-2">Oops! Something went wrong.</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. We have logged the issue and will look into it.
            </p>
            <p className="text-sm text-muted-foreground mb-4">You can try refreshing the page to resolve the issue.</p>
            
            {this.state.error && (
                <details className="mb-6 text-left bg-muted/20 p-4 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                        {this.state.error.toString()}
                    </pre>
                </details>
            )}

            <Button
              onClick={this.handleReset}
              className="px-6 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-glow"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
