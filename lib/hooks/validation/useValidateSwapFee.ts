import { useMemo } from "react";
import { GqlPoolType } from "@/lib/services/apollo/generated/graphql";
import { SWAP_FEE_PARAMS } from "@/constants/constants";

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
