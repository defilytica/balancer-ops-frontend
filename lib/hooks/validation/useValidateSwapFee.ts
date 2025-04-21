import { useMemo } from "react";
import { GqlPoolType } from "@/lib/services/apollo/generated/graphql";

// Constants for swap fee validation
export const SWAP_FEE_PARAMS = {
  // For Weighted and Stable pools
  STANDARD: {
    MIN: 0.001, // 0.001%
    MAX: 10, // 10%
  },
  // For all other pool types
  OTHER: {
    MIN: 0, // 0%
    MAX: 100, // 100%
  },
};

export function isStandardRangePool(poolType: GqlPoolType): boolean {
  return poolType === GqlPoolType.Weighted || poolType === GqlPoolType.Stable;
}

export function getSwapFeeRange(poolType: GqlPoolType) {
  return isStandardRangePool(poolType) ? SWAP_FEE_PARAMS.STANDARD : SWAP_FEE_PARAMS.OTHER;
}

export function useValidateSwapFee(params: { swapFeePercentage: string; poolType: GqlPoolType }) {
  const { swapFeePercentage, poolType } = params;

  const validationResult = useMemo(() => {
    let swapFeePercentageError: string | null = null;

    // Determine which range to use based on pool type
    const range = getSwapFeeRange(poolType);

    // Validate swapFeePercentage
    if (swapFeePercentage) {
      const numValue = parseFloat(swapFeePercentage);
      if (isNaN(numValue)) {
        swapFeePercentageError = "Please enter a valid number";
      } else if (numValue < range.MIN) {
        swapFeePercentageError = `Value must be at least ${range.MIN}%`;
      } else if (numValue > range.MAX) {
        swapFeePercentageError = `Value must not exceed ${range.MAX}%`;
      }
    }

    return {
      swapFeePercentageError,
      isValid: !swapFeePercentageError,
    };
  }, [swapFeePercentage, poolType]);

  return validationResult;
}
