import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import EmptyState from "./EmptyState";
import ErrorBoundary from "./ErrorBoundary";
import Loading from "./Loading";

function ExplodingChild() {
  throw new Error("render failed");
}

describe("common state components", () => {
  it("renders loading message", () => {
    render(<Loading message="Fetching dashboard" />);

    expect(screen.getByText("Fetching dashboard")).toBeInTheDocument();
  });

  it("renders empty state content and action", () => {
    render(
      <EmptyState
        title="No expenses"
        description="Nothing matches these filters."
        action={<button type="button">Reset filters</button>}
      />,
    );

    expect(screen.getByText("No expenses")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
  });

  it("renders error boundary fallback when a child throws", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ExplodingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload page/i })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
