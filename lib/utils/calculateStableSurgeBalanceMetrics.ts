import { Pool } from "@/types/interfaces";
import { isStableSurgeHookParams } from "@/components/StableSurgeHookConfigurationModule";

export interface StableSurgeBalanceMetrics {
  tokenPercentages: Array<{
    symbol: string;
    percentage: number;
    balance: string;
    balanceUSD: string;
  }>;
  balanceRatio: string;
  idealPercentage: string;
  isInSurgeMode: boolean;
  estimatedSurgeFee: string;
  surgeThreshold: string;
  maxSurgeFee: string;
}

/**
 * Calculate token balance percentage for a pool
 */
export const calculateTokenPercentage = (token: Pool["poolTokens"][0], pool: Pool): string => {
  if (!token.balanceUSD || !pool.dynamicData?.totalLiquidity) {
    return "0.0";
  }

  const tokenUSDValue = parseFloat(token.balanceUSD);
  const totalLiquidity = parseFloat(pool.dynamicData.totalLiquidity);

  if (totalLiquidity === 0) {
    return "0.0";
  }

  const percentage = (tokenUSDValue / totalLiquidity) * 100;
  return percentage.toFixed(1);
};

/**
 * Calculate StableSurge-specific balance metrics including deviation from ideal distribution,
 * surge mode status, and estimated surge fees based on current pool balance ratios.
 *
 * @param pool - Pool object containing token balances and hook parameters
 * @returns StableSurge balance metrics or null if not applicable
 */
export const calculateStableSurgeBalanceMetrics = (
  pool: Pool,
): StableSurgeBalanceMetrics | null => {
  if (!isStableSurgeHookParams(pool.hook?.params) || !pool.poolTokens.length) {
    return null;
  }

  const tokens = pool.poolTokens;
  const tokenCount = tokens.length;

  // Calculate token balance percentages
  const tokenPercentages = tokens.map(token => {
    const percentage = parseFloat(calculateTokenPercentage(token, pool));
    return {
      symbol: token.symbol,
      percentage,
      balance: token.balance || "0",
      balanceUSD: token.balanceUSD || "0",
    };
  });

  // Calculate balance distribution metrics using the same logic as the reference app
  const percentages = tokenPercentages.map(t => t.percentage);

  // Calculate median as reference point (matching reference app logic)
  let median: number;
  if (tokenCount === 2) {
    // For 2 tokens, median is always 50
    median = 50;
  } else {
    // For more tokens, calculate actual median
    const sortedPercentages = [...percentages].sort((a, b) => a - b);
    const mid = Math.floor(sortedPercentages.length / 2);
    median =
      sortedPercentages.length % 2 === 0
        ? (sortedPercentages[mid - 1] + sortedPercentages[mid]) / 2
        : sortedPercentages[mid];
  }

  // Calculate total imbalance as sum of absolute deviations from median
  const totalImbalance = percentages.reduce((sum, percentage) => {
    return sum + Math.abs(percentage - median);
  }, 0);

  // Calculate ideal distribution (equal for each token) for display purposes
  const idealPercentage = 100 / tokenCount;

  // Get surge threshold from hook params - convert from decimal to percentage
  const surgeThreshold = parseFloat(pool.hook.params.surgeThresholdPercentage || "0") * 100;
  const maxSurgeFee = parseFloat(pool.hook.params.maxSurgeFeePercentage || "0") * 100;

  // Determine if pool is in surge pricing mode using total imbalance
  const isInSurgeMode = totalImbalance > surgeThreshold;

  // Calculate estimated surge fee if applicable
  let estimatedSurgeFee = 0;
  if (isInSurgeMode && surgeThreshold > 0) {
    const surgeIntensity = Math.min((totalImbalance - surgeThreshold) / surgeThreshold, 1);
    estimatedSurgeFee = surgeIntensity * maxSurgeFee;
  }

  return {
    tokenPercentages,
    balanceRatio: totalImbalance.toFixed(2), // Using totalImbalance for consistency with reference app
    idealPercentage: idealPercentage.toFixed(1),
    isInSurgeMode,
    estimatedSurgeFee: estimatedSurgeFee.toFixed(3),
    surgeThreshold: surgeThreshold.toFixed(2),
    maxSurgeFee: maxSurgeFee.toFixed(2),
  };
};
