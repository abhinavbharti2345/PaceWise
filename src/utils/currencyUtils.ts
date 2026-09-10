/**
 * Smart currency and number formatting with en-IN locale.
 * - No trailing zeros for whole numbers: 50 -> "50", 2774 -> "2,774"
 * - Dynamic precision up to 2 decimal places: 125.5 -> "125.5", 125.54 -> "125.54"
 * - Rounded to 2 decimals if more: 125.546 -> "125.55"
 */

export const formatNumber = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};
