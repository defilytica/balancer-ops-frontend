import { MEV_CAPTURE_PARAMS } from "@/constants/constants";
import { useMemo } from "react";

export function useValidateMevCapture(params: {
  mevTaxThreshold: string;
  mevTaxMultiplier: string;
}) {
  const { mevTaxThreshold, mevTaxMultiplier } = params;

  // Use useMemo to compute validation results synchronously
  const validationResult = useMemo(() => {
    let mevTaxThresholdError: string | null = null;
    let mevTaxMultiplierError: string | null = null;

    // Validate mevTaxThreshold
    if (mevTaxThreshold) {
      const numValue = parseFloat(mevTaxThreshold);
      if (isNaN(numValue)) {
        mevTaxThresholdError = "Please enter a valid number";
      } else if (numValue < MEV_CAPTURE_PARAMS.THRESHOLD.MIN) {
        mevTaxThresholdError = `Value must be at least ${MEV_CAPTURE_PARAMS.THRESHOLD.MIN} Gwei`;
      } else if (numValue > MEV_CAPTURE_PARAMS.THRESHOLD.MAX) {
        mevTaxThresholdError = `Value must not exceed ${MEV_CAPTURE_PARAMS.THRESHOLD.MAX} Gwei`;
      }
    }

    // Validate mevTaxMultiplier
    if (mevTaxMultiplier) {
      const numValue = Number(mevTaxMultiplier);
      if (isNaN(numValue)) {
        mevTaxMultiplierError = "Please enter a valid number";
      } else if (!Number.isInteger(numValue)) {
        mevTaxMultiplierError = "Please enter a whole number (no decimals)";
      } else if (numValue < MEV_CAPTURE_PARAMS.MULTIPLIER.MIN) {
        mevTaxMultiplierError = `Value must be at least ${MEV_CAPTURE_PARAMS.MULTIPLIER.MIN}`;
      } else if (numValue > MEV_CAPTURE_PARAMS.MULTIPLIER.MAX) {
        mevTaxMultiplierError = `Value must not exceed ${MEV_CAPTURE_PARAMS.MULTIPLIER.MAX}`;
      }
    }

    return {
      mevTaxThresholdError,
      mevTaxMultiplierError,
      isValid: !mevTaxThresholdError && !mevTaxMultiplierError,
    };
  }, [mevTaxThreshold, mevTaxMultiplier]);

  return validationResult;
}
