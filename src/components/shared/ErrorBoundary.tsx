import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg min-h-[300px] text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <h2 className="text-xl font-bold text-destructive mb-2">Đã xảy ra lỗi hệ thống</h2>
                    <p className="text-muted-foreground mb-4 max-w-md">
                        Chúng tôi rất tiếc vì sự cố này. Vui lòng thử tải lại trang.
                    </p>

                    <div className="bg-white p-4 rounded border mb-6 text-left w-full max-w-lg overflow-auto max-h-48">
                        <p className="font-mono text-xs text-red-600 font-semibold mb-2">
                            {this.state.error?.toString()}
                        </p>
                        <pre className="font-mono text-[10px] text-gray-500">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>

                    <Button onClick={() => window.location.reload()} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Tải lại trang
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
