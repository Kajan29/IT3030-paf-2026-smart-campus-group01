import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import authService from "@/services/authService";

describe("authService local session helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("saves auth data and exposes the authenticated user state", () => {
    authService.saveAuthData("token-123", {
      email: "student@zentaritas.com",
      role: "STUDENT",
    });

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getAccessToken()).toBe("token-123");
    expect(authService.getCurrentUser()).toEqual({
      email: "student@zentaritas.com",
      role: "STUDENT",
    });
  });

  it("updates session activity only for active sessions", () => {
    authService.updateSessionActivity();
    expect(localStorage.getItem("lastActivityAt")).toBeNull();

    authService.setAccessToken("token-456");
    authService.updateSessionActivity();

    expect(Number(localStorage.getItem("lastActivityAt"))).toBeGreaterThan(0);
  });

  it("detects an expired session from inactivity and clears data on logout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T10:00:00Z"));

    authService.saveAuthData("token-789", {
      email: "staff@zentaritas.com",
      role: "NON_ACADEMIC_STAFF",
    });

    vi.setSystemTime(new Date("2026-04-23T10:31:00Z"));

    expect(authService.isSessionExpired()).toBe(true);

    authService.logout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem("lastActivityAt")).toBeNull();
  });
});
