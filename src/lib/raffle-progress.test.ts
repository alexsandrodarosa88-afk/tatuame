import { describe, expect, test } from "bun:test";
import { remainingPercent, RAFFLE_CLOSING_PERCENT } from "./raffle-progress";

describe("public raffle progress", () => {
  test("remaining percentage complements the displayed sold percentage", () => {
    expect(remainingPercent(65)).toBe(35);
    expect(remainingPercent(90)).toBe(10);
    expect(remainingPercent(72.3)).toBe(27.7);
    expect(remainingPercent(100)).toBe(0);
    expect(remainingPercent(0)).toBe(100);
  });

  test("closing notice uses 90 percent of quotas", () => {
    expect(RAFFLE_CLOSING_PERCENT).toBe(90);
  });
});