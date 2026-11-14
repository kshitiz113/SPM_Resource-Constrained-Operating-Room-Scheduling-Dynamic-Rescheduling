import React from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI error caught by boundary', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center">
          <h2 className="text-lg font-bold text-slate-100">Something went wrong</h2>
          <p className="mt-2 text-xs text-slate-400 font-mono break-words">{this.state.error.message}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-200 hover:bg-slate-800"
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-4 py-2 rounded-lg bg-teal-600 text-xs font-semibold text-white hover:bg-teal-500"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
