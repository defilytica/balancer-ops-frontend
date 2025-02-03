import { formatUnits } from "viem";

export const calculateRatios = (underlying: bigint, wrapped: bigint, decimals: number) => {
  const underlyingValue = Number(formatUnits(underlying, decimals));
  const wrappedValue = Number(formatUnits(wrapped, decimals));
  const total = underlyingValue + wrappedValue;

  if (total === 0) return { underlying: "0.0", wrapped: "0.0" };

  const underlyingPercent = ((underlyingValue / total) * 100).toFixed(1);
  const wrappedPercent = ((wrappedValue / total) * 100).toFixed(1);

  return { underlying: underlyingPercent, wrapped: wrappedPercent };
};
