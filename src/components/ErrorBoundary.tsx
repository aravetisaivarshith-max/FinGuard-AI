import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let cleanMessage = 'An unexpected error occurred while processing your request.';
    try {
      const parsed = JSON.parse(error.message) as { operationType?: string; error?: string };
      if (parsed.operationType) {
        cleanMessage = `Database ${parsed.operationType} request could not be completed. Please verify you are signed in with a verified Google account.`;
      }
    } catch {
      if (error.message && error.message.length < 180) {
        cleanMessage = error.message;
      }
    }
    return { hasError: true, message: cleanMessage };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0F172A] border border-slate-800 rounded-xl p-8">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold font-display">Session Protection Notice</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
