import { STABLE_SURGE_PARAMS } from "@/constants/constants";

export function useValidateStableSurge(params: {
  maxSurgeFeePercentage: string;
  surgeThresholdPercentage: string;
}) {
  const { maxSurgeFeePercentage, surgeThresholdPercentage } = params;

  // Compute validation results synchronously
  const validationResult = (() => {
    let maxSurgeFeePercentageError: string | null = null;
    let surgeThresholdPercentageError: string | null = null;

    // Validate maxSurgeFeePercentage
    if (maxSurgeFeePercentage) {
      const numValue = parseFloat(maxSurgeFeePercentage);
      if (isNaN(numValue)) {
        maxSurgeFeePercentageError = "Please enter a valid number";
      } else if (numValue < STABLE_SURGE_PARAMS.MAX_SURGE_FEE.MIN) {
        maxSurgeFeePercentageError = `Value must be at least ${STABLE_SURGE_PARAMS.MAX_SURGE_FEE.MIN}%`;
      } else if (numValue > STABLE_SURGE_PARAMS.MAX_SURGE_FEE.MAX) {
        maxSurgeFeePercentageError = `Value must not exceed ${STABLE_SURGE_PARAMS.MAX_SURGE_FEE.MAX}%`;
      }
    }

    // Validate surgeThresholdPercentage
    if (surgeThresholdPercentage) {
      const numValue = parseFloat(surgeThresholdPercentage);
      if (isNaN(numValue)) {
        surgeThresholdPercentageError = "Please enter a valid number";
      } else if (numValue < STABLE_SURGE_PARAMS.SURGE_THRESHOLD.MIN) {
        surgeThresholdPercentageError = `Value must be at least ${STABLE_SURGE_PARAMS.SURGE_THRESHOLD.MIN}%`;
      } else if (numValue > STABLE_SURGE_PARAMS.SURGE_THRESHOLD.MAX) {
        surgeThresholdPercentageError = `Value must not exceed ${STABLE_SURGE_PARAMS.SURGE_THRESHOLD.MAX}%`;
      }
    }

    return {
      maxSurgeFeePercentageError,
      surgeThresholdPercentageError,
      isValid: !maxSurgeFeePercentageError && !surgeThresholdPercentageError,
    };
  })();

  return validationResult;
}
