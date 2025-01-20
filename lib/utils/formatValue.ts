import { formatUnits } from "viem";

export const formatValue = (value: bigint, decimals: number) => {
  const parsed = Number(formatUnits(value, decimals));
  if (parsed >= 1000000) {
    return `${(parsed / 1000000).toFixed(2)}M`;
  } else if (parsed >= 1000) {
    return `${(parsed / 1000).toFixed(2)}K`;
  }
  return parsed.toFixed(2);
};
