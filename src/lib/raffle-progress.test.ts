import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { remainingPercent, RAFFLE_CLOSING_PERCENT } from "./raffle-progress";

describe("public raffle progress", () => {
  test("remaining percentage complements the displayed sold percentage", () => {
    assert.equal(remainingPercent(65), 35);
    assert.equal(remainingPercent(90), 10);
    assert.equal(remainingPercent(72.3), 27.7);
    assert.equal(remainingPercent(100), 0);
    assert.equal(remainingPercent(0), 100);
  });

  test("closing notice uses 90 percent of quotas", () => {
    assert.equal(RAFFLE_CLOSING_PERCENT, 90);
  });
});