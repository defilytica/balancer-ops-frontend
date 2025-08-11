export const formatTokenAmount = (amount: string | number, decimals?: number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num) || num === 0) return "0";

  // For very small numbers, show more decimals
  if (num < 0.01) {
    return num.toFixed(6);
  }

  // For small numbers, show 4 decimals
  if (num < 1) {
    return num.toFixed(4);
  }

  // For medium numbers, show 2 decimals
  if (num < 1000) {
    return num.toFixed(2);
  }

  // For large numbers, use compact notation
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};
