/**
 * Calculates the surge fee percentage based on pool imbalance
 * @param maxSurgeFeePercentage Maximum surge fee that can be applied (e.g., 0.1 for 10%)
 * @param surgeThresholdPercentage Threshold at which surge fee starts to apply (e.g., 0.02 for 2%)
 * @param staticFeePercentage Base fee percentage that always applies (e.g., 0.003 for 0.3%)
 * @param poolNewBalances Array of projected pool balances after the swap
 * @param poolCurrentBalances Array of current pool balances
 * @returns The calculated fee percentage (e.g., 0.05 for 5%)
 */
export function getSurgeFeePercentage(
  maxSurgeFeePercentage: number,
  surgeThresholdPercentage: number,
  staticFeePercentage: number,
  poolNewBalances: number[],
  poolCurrentBalances: number[]
): number {
  // If max surge fee is less than static fee, just return static fee
  if (maxSurgeFeePercentage < staticFeePercentage) {
    return staticFeePercentage;
  }

  const newImbalance = calculateImbalance(poolNewBalances);

  const surging = isSurging(
    surgeThresholdPercentage,
    poolCurrentBalances,
    newImbalance
  );

  if (!surging) {
    return staticFeePercentage;
  }

  const newFee =
    staticFeePercentage +
    ((maxSurgeFeePercentage - staticFeePercentage) *
      (newImbalance - surgeThresholdPercentage)) /
      (100 - surgeThresholdPercentage);

  return newFee;
}

/**
 * Calculates the imbalance from an array of numbers by:
 * 1. Finding the median of the numbers
 * 2. Calculating the sum of all balances
 * 3. Summing the absolute differences between each balance and the median
 * 4. Returning the ratio of total differences to total balances
 * @param amounts Array of numbers to calculate imbalance from
 * @returns The calculated imbalance value
 */
export function calculateImbalance(poolBalances: number[]): number {
  if (poolBalances.length === 0) return 0;

  // Calculate median
  const sorted = [...poolBalances].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Calculate sum of all balances
  const totalBalance = poolBalances.reduce((sum, amount) => sum + amount, 0);

  // If total balance is 0, return 0 to avoid division by zero
  if (totalBalance === 0) return 0;

  // Sum the absolute differences between each balance and the median
  const totalDifferences = poolBalances.reduce(
    (sum, balance) => sum + Math.abs(balance - median),
    0
  );

  // Return the ratio of differences to total balance
  return (100 * totalDifferences) / totalBalance;
}

/**
 * Determines if the pool is in a surge state by comparing the imbalance with the surge threshold
 * @param surgeThresholdPercentage Threshold at which surge fee starts to apply (e.g., 0.02 for 2%)
 * @param poolNewBalances Array of projected pool balances after the swap
 * @param poolCurrentBalances Array of current pool balances
 * @returns Boolean indicating whether the pool is surging
 */
export function isSurging(
  surgeThresholdPercentage: number,
  poolCurrentBalances: number[],
  newTotalImbalance: number
): boolean {
  // If we are balanced, or the balance has improved, do not surge: simply return the regular fee percentage.
  if (newTotalImbalance == 0) {
    return false;
  }

  const currentImbalance = calculateImbalance(poolCurrentBalances);
  // If the imbalance has worsened, and is above the threshold, we are surging.
  return (
    newTotalImbalance > currentImbalance &&
    newTotalImbalance > surgeThresholdPercentage
  );
}
