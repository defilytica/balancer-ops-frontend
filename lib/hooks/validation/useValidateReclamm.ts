import { useMemo } from "react";
import { ReClammContractData } from "@/types/interfaces";

export interface UseValidateReClammParams {
  centerednessMargin: string;
  dailyPriceShiftExponent: string;
  endPriceRatio: string;
  priceRatioUpdateStartTime: string;
  priceRatioUpdateEndTime: string;
  reClammContractData?: ReClammContractData;
}

export function useValidateReclamm(params: UseValidateReClammParams) {
  const {
    centerednessMargin,
    dailyPriceShiftExponent,
    endPriceRatio,
    priceRatioUpdateStartTime,
    priceRatioUpdateEndTime,
    reClammContractData,
  } = params;

  const validationResult = useMemo(() => {
    // Centeredness margin validation
    let centerednessMarginError = "";
    let isCenterednessMarginValid = false;
    if (centerednessMargin) {
      const value = parseFloat(centerednessMargin);
      if (isNaN(value)) {
        centerednessMarginError = "Please enter a valid number";
      } else if (value < 0) {
        centerednessMarginError = "Centeredness margin must be non-negative";
      } else if (value > 100) {
        centerednessMarginError = "Centeredness margin must be between 0 and 100";
      } else {
        isCenterednessMarginValid = true;
      }
    }

    // Daily price shift exponent validation
    let dailyPriceShiftExponentError = "";
    let isDailyPriceShiftExponentValid = false;
    if (dailyPriceShiftExponent) {
      const value = parseFloat(dailyPriceShiftExponent);
      if (isNaN(value)) {
        dailyPriceShiftExponentError = "Please enter a valid number";
      } else if (value < 0) {
        dailyPriceShiftExponentError = "Daily price shift exponent must be non-negative";
      } else {
        isDailyPriceShiftExponentValid = true;
      }
    }

    // End price ratio validation
    let endPriceRatioError = "";
    let isEndPriceRatioValid = false;
    if (endPriceRatio) {
      const value = parseFloat(endPriceRatio);
      if (isNaN(value)) {
        endPriceRatioError = "Please enter a valid number";
      } else if (value <= 0) {
        endPriceRatioError = "End price ratio must be positive";
      } else {
        isEndPriceRatioValid = true;
      }
    }

    // Price ratio update start time validation
    let priceRatioUpdateStartTimeError = "";
    let isPriceRatioUpdateStartTimeValid = false;
    if (priceRatioUpdateStartTime) {
      const timestamp = parseInt(priceRatioUpdateStartTime);
      if (isNaN(timestamp)) {
        priceRatioUpdateStartTimeError = "Please enter a valid timestamp";
      } else if (timestamp <= 0) {
        priceRatioUpdateStartTimeError = "Start time must be positive";
      } else if (timestamp < Math.floor(Date.now() / 1000)) {
        priceRatioUpdateStartTimeError = "Start time cannot be in the past";
      } else {
        isPriceRatioUpdateStartTimeValid = true;
      }
    }

    // Price ratio update end time validation
    let priceRatioUpdateEndTimeError = "";
    let isPriceRatioUpdateEndTimeValid = false;
    if (priceRatioUpdateEndTime) {
      const endTimestamp = parseInt(priceRatioUpdateEndTime);
      const startTimestamp = parseInt(priceRatioUpdateStartTime);
      if (isNaN(endTimestamp)) {
        priceRatioUpdateEndTimeError = "Please enter a valid timestamp";
      } else if (endTimestamp <= 0) {
        priceRatioUpdateEndTimeError = "End time must be positive";
      } else if (!isNaN(startTimestamp) && endTimestamp <= startTimestamp) {
        priceRatioUpdateEndTimeError = "End time must be after start time";
      } else {
        isPriceRatioUpdateEndTimeValid = true;
      }
    }

    // Derived states
    const hasCenterednessMargin = centerednessMargin && isCenterednessMarginValid;
    const hasDailyPriceShiftExponent = dailyPriceShiftExponent && isDailyPriceShiftExponentValid;

    // Check if all price ratio update fields are provided and valid
    const hasPriceRatioUpdate =
      endPriceRatio &&
      priceRatioUpdateStartTime &&
      priceRatioUpdateEndTime &&
      isEndPriceRatioValid &&
      isPriceRatioUpdateStartTimeValid &&
      isPriceRatioUpdateEndTimeValid;

    // Only show price ratio preview when all fields are complete
    const hasEndPriceRatioOnly = hasPriceRatioUpdate;

    // Calculate current values for display
    const currentDailyPriceShiftExponent = (() => {
      if (!reClammContractData?.dailyPriceShiftExponent) return "";
      try {
        const displayValue = (
          (parseFloat(reClammContractData.dailyPriceShiftExponent.toString()) / 1e18) *
          100
        ).toString();
        return displayValue;
      } catch {
        return "";
      }
    })();

    const currentPriceRatio = (() => {
      if (!reClammContractData?.currentPriceRatio) return "";
      try {
        const displayValue = (
          parseFloat(reClammContractData.currentPriceRatio.toString()) / 1e18
        ).toFixed(6);
        return displayValue;
      } catch {
        return "";
      }
    })();

    const isValid = hasCenterednessMargin || hasDailyPriceShiftExponent || hasPriceRatioUpdate;

    return {
      // Validation states
      isCenterednessMarginValid,
      isDailyPriceShiftExponentValid,
      isEndPriceRatioValid,
      isPriceRatioUpdateStartTimeValid,
      isPriceRatioUpdateEndTimeValid,

      // Error messages
      centerednessMarginError,
      dailyPriceShiftExponentError,
      endPriceRatioError,
      priceRatioUpdateStartTimeError,
      priceRatioUpdateEndTimeError,

      // Derived states
      hasCenterednessMargin,
      hasDailyPriceShiftExponent,
      hasEndPriceRatioOnly,
      hasPriceRatioUpdate,

      // Current values for display
      currentDailyPriceShiftExponent,
      currentPriceRatio,

      // Overall validation
      isValid,
    };
  }, [
    centerednessMargin,
    dailyPriceShiftExponent,
    endPriceRatio,
    priceRatioUpdateStartTime,
    priceRatioUpdateEndTime,
    reClammContractData,
  ]);

  return validationResult;
}
