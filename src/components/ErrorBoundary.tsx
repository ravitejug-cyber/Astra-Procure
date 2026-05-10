"use client";

import React from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
            <p className="font-semibold text-red-700">Something went wrong rendering the result.</p>
            <p className="text-xs text-red-500">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-xl bg-red-600 text-white text-xs font-semibold px-4 py-2 hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
