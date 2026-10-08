import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readUploadPayload } from "@/lib/loading/upload";
import {
  finishOperation,
  getProgressSnapshot,
  resetOperations,
  setOperationProgress,
  startOperation,
} from "@/lib/loading/operations";

describe("operation progress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetOperations();
  });

  afterEach(() => {
    resetOperations();
    vi.useRealTimers();
  });

  it("stays hidden before 100ms and after a fast finish", () => {
    startOperation("fast");
    expect(getProgressSnapshot().visible).toBe(false);
    vi.advanceTimersByTime(40);
    finishOperation("fast");
    vi.advanceTimersByTime(500);
    expect(getProgressSnapshot()).toMatchObject({ busy: false, visible: false, activeCount: 0 });
  });

  it("shows an indeterminate bar only after 100ms", () => {
    startOperation("save");
    vi.advanceTimersByTime(99);
    expect(getProgressSnapshot().visible).toBe(false);
    vi.advanceTimersByTime(1);
    expect(getProgressSnapshot()).toMatchObject({
      busy: true,
      visible: true,
      mode: "indeterminate",
      ratio: null,
    });
  });

  it("hides the global bar only when every operation finishes", () => {
    startOperation("a");
    startOperation("b");
    vi.advanceTimersByTime(100);
    finishOperation("a");
    expect(getProgressSnapshot().visible).toBe(true);
    expect(getProgressSnapshot().activeCount).toBe(1);
    finishOperation("b");
    expect(getProgressSnapshot().visible).toBe(false);
  });

  it("reports real combined bytes and does not invent a percent without a total", () => {
    startOperation("upload", { mode: "determinate" });
    startOperation("checkout");
    setOperationProgress("upload", 25, 100);
    vi.advanceTimersByTime(100);
    expect(getProgressSnapshot()).toMatchObject({ mode: "determinate", ratio: 0.25, activeCount: 2 });

    finishOperation("upload");
    expect(getProgressSnapshot()).toMatchObject({ mode: "indeterminate", ratio: null, activeCount: 1 });

    finishOperation("checkout");
    expect(getProgressSnapshot().visible).toBe(false);
  });

  it("stops on error by removing the operation", () => {
    startOperation("upload", { mode: "determinate" });
    setOperationProgress("upload", 10, 80);
    vi.advanceTimersByTime(100);
    finishOperation("upload");
    expect(getProgressSnapshot().busy).toBe(false);
  });
});

describe("upload response", () => {
  it("accepts only a confirmed public url", () => {
    expect(readUploadPayload(200, JSON.stringify({ status: "uploaded", publicUrl: "https://cdn.example/a.jpg" }))).toEqual({
      ok: true,
      publicUrl: "https://cdn.example/a.jpg",
    });
    expect(readUploadPayload(503, JSON.stringify({ status: "not-configured" })).ok).toBe(false);
    expect(readUploadPayload(500, "not-json").ok).toBe(false);
    expect(readUploadPayload(200, JSON.stringify({ status: "uploaded" })).ok).toBe(false);
  });
});
