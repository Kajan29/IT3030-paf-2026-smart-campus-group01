import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { capitalizeFirst, debounce, isEmpty, truncateText } from "@/utils/helpers";

describe("helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("truncates long text with an ellipsis", () => {
    expect(truncateText("Smart campus platform", 5)).toBe("Smart...");
    expect(truncateText("Short", 10)).toBe("Short");
  });

  it("capitalizes the first character of a string", () => {
    expect(capitalizeFirst("student")).toBe("Student");
  });

  it("detects whether an object has keys", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ status: "active" })).toBe(false);
  });

  it("debounces repeated calls and keeps the latest arguments", () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced("first");
    debounced("second");
    vi.advanceTimersByTime(299);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("second");
  });
});
