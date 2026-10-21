/** Complement of the sold percentage displayed to visitors. */
export function remainingPercent(soldPercent: number = 0): number {
  return Math.round(Math.max(0, Math.min(100, 100 - soldPercent)) * 10) / 10;
}

export const RAFFLE_CLOSING_PERCENT = 90;