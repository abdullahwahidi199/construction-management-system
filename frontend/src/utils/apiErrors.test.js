import { describe, expect, it } from "vitest";

import {
  attachFriendlyError,
  extractValidationMessages,
  formatRetryAfterMessage,
  getFieldErrors,
  getFriendlyErrorMessage,
} from "./apiErrors";

describe("api error helpers", () => {
  it("extracts nested validation messages and removes technical noise", () => {
    const messages = extractValidationMessages({
      errors: {
        first_name: ["This field is required."],
        database: "IntegrityError: duplicate key",
        nested: { amount_usd: ["Must be greater than zero."] },
      },
    });

    expect(messages).toContain("First Name: This field is required.");
    expect(messages).toContain("Amount Usd: Must be greater than zero.");
    expect(messages.join(" ")).not.toMatch(/IntegrityError/i);
  });

  it("returns user-friendly messages for common transport failures", () => {
    expect(getFriendlyErrorMessage({ code: "ECONNABORTED" })).toBe(
      "The request timed out. Please try again.",
    );
    expect(getFriendlyErrorMessage({ message: "Network Error" })).toBe(
      "Network connection lost.",
    );
    expect(
      getFriendlyErrorMessage({
        response: { status: 403, data: { detail: "Forbidden" } },
      }),
    ).toBe("You don't have permission to perform this action.");
  });

  it("shows retry-after minutes for login rate limits", () => {
    expect(formatRetryAfterMessage(900)).toBe(
      "Too many login attempts. Please wait 15 minutes before trying again.",
    );
    expect(
      getFriendlyErrorMessage({
        response: { status: 429, data: { retry_after: 120 } },
      }),
    ).toBe("Too many login attempts. Please wait 2 minutes before trying again.");
  });

  it("maps backend field errors into form-friendly strings", () => {
    const error = {
      response: {
        data: {
          errors: {
            email: ["Already exists."],
            non_field_errors: ["Invalid state."],
          },
        },
      },
    };

    expect(getFieldErrors(error)).toEqual({
      email: "Already exists.",
      non_field_errors: "Invalid state.",
    });
  });

  it("attaches derived metadata to thrown errors", () => {
    const error = {
      response: {
        status: 400,
        data: { errors: { amount: ["Required."] } },
      },
    };

    expect(attachFriendlyError(error)).toMatchObject({
      userMessage: "Amount: Required.",
      validationErrors: { amount: "Required." },
    });
  });
});
