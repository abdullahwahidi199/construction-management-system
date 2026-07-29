import React from "react";
import { AlertTriangle, RefreshCcw, LayoutDashboard } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("Unhandled React rendering error", error, info);
    }
  }

  goDashboard = () => {
    window.location.assign("/");
  };

  reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
        <section className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
            <AlertTriangle className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            The page could not be displayed safely. Please return to the dashboard or reload the page.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.goDashboard}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={this.reload}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload Page
            </button>
          </div>
        </section>
      </main>
    );
  }
}

