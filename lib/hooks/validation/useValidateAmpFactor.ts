import { useMemo } from "react";

// Constants for amplification factor validation
export const AMP_FACTOR_PARAMS = {
  MIN: 1,
  MAX: 10000,
  MAX_CHANGE_FACTOR_PER_DAY: 2,
} as const;

export interface AmpFactorValidationParams {
  value: string;
  currentAmp: number;
  endDateTime: string;
}

export interface AmpFactorValidationResult {
  ampFactorError: string | null;
  isValid: boolean;
  rateLimitInfo: {
    daysUntilEnd: number;
    minAllowed: number;
    maxAllowed: number;
    maxChangeFactor: number;
  } | null;
}

export function useValidateAmpFactor(params: AmpFactorValidationParams): AmpFactorValidationResult {
  const { value, currentAmp, endDateTime } = params;

  const validationResult = useMemo(() => {
    let ampFactorError: string | null = null;
    let rateLimitInfo: AmpFactorValidationResult["rateLimitInfo"] = null;

    // Early return if no value provided
    if (!value || value.trim() === "") {
      return {
        ampFactorError: null,
        isValid: false,
        rateLimitInfo: null,
      };
    }

    // Basic number validation
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      ampFactorError = "Must be a valid number";
    } else if (numValue < AMP_FACTOR_PARAMS.MIN) {
      ampFactorError = `Amplification factor must be at least ${AMP_FACTOR_PARAMS.MIN}`;
    } else if (numValue > AMP_FACTOR_PARAMS.MAX) {
      ampFactorError = `Amplification factor must not exceed ${AMP_FACTOR_PARAMS.MAX.toLocaleString()}`;
    }

    // If basic validation failed or we don't have required data for rate limit validation
    if (ampFactorError || !currentAmp || !endDateTime) {
      return {
        ampFactorError,
        isValid: !ampFactorError && !!value && !!currentAmp && !!endDateTime,
        rateLimitInfo: null,
      };
    }

    // Rate limit validation
    const selectedTime = new Date(endDateTime);
    const now = new Date();
    const timeDiffHours = (selectedTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Calculate maximum allowed change based on time duration
    // Rule: Cannot change more than factor of 2 per day (24 hours)
    const daysUntilEnd = Math.max(timeDiffHours / 24, 1); // Minimum 1 day
    const maxChangeFactor = Math.pow(AMP_FACTOR_PARAMS.MAX_CHANGE_FACTOR_PER_DAY, daysUntilEnd);

    const minAllowed = Math.max(AMP_FACTOR_PARAMS.MIN, currentAmp / maxChangeFactor);
    const maxAllowed = Math.min(AMP_FACTOR_PARAMS.MAX, currentAmp * maxChangeFactor);

    // Store rate limit info for display
    rateLimitInfo = {
      daysUntilEnd,
      minAllowed: Math.round(minAllowed),
      maxAllowed: Math.round(maxAllowed),
      maxChangeFactor,
    };

    // Check rate limits
    if (numValue < minAllowed) {
      ampFactorError = `Value too low. With current amp factor ${Math.round(currentAmp)} and ${daysUntilEnd.toFixed(1)} days, minimum allowed is ${Math.round(minAllowed)}`;
    } else if (numValue > maxAllowed) {
      ampFactorError = `Value too high. With current amp factor ${Math.round(currentAmp)} and ${daysUntilEnd.toFixed(1)} days, maximum allowed is ${Math.round(maxAllowed)}`;
    }

    return {
      ampFactorError,
      isValid: !ampFactorError && !!value,
      rateLimitInfo,
    };
  }, [value, currentAmp, endDateTime]);

  return validationResult;
}
