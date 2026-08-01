import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../api/axiosInstance", () => ({
  default: api,
}));

import useDelete from "./useDelete";
import useFetch from "./useFetch";
import usePost from "./usePost";

describe("API hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useFetch loads data and exposes refetch", async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

    const { result } = renderHook(() => useFetch("projects/"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);

    api.get.mockResolvedValueOnce({ data: [{ id: 2 }] });
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.data).toEqual([{ id: 2 }]);
  });

  it("useFetch stores friendly error state on failure", async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500 } });

    const { result } = renderHook(() => useFetch("broken/"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe("Something went wrong. Please try again in a moment.");
  });

  it("usePost toggles loading and returns response data", async () => {
    api.post.mockResolvedValueOnce({ data: { id: 10 } });
    const { result } = renderHook(() => usePost());

    let created;
    await act(async () => {
      created = await result.current.postData("employees/", { first_name: "Amina" });
    });

    expect(created).toEqual({ id: 10 });
    expect(result.current.loading).toBe(false);
    expect(api.post).toHaveBeenCalledWith("employees/", { first_name: "Amina" });
  });

  it("useDelete surfaces friendly errors", async () => {
    api.delete.mockRejectedValueOnce({
      response: { status: 403 },
      config: { method: "delete", url: "employees/1/" },
    });
    const { result } = renderHook(() => useDelete());

    let thrown;
    await act(async () => {
      try {
        await result.current.deleteData("employees/1/");
      } catch (err) {
        thrown = err;
      }
    });

    expect(thrown).toBeTruthy();
    await waitFor(() =>
      expect(result.current.error).toBe(
        "You don't have permission to delete employees.",
      ),
    );
  });
});
