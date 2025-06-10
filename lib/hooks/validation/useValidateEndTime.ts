import { useMemo } from "react";

// Constants for end time validation
export const END_TIME_PARAMS = {
  MIN_HOURS_FROM_NOW: 24,
} as const;

export interface EndTimeValidationParams {
  value: string;
}

export interface EndTimeValidationResult {
  endTimeError: string | null;
  isValid: boolean;
  unixTimestamp: number | null;
  timeInfo: {
    hoursFromNow: number;
    daysFromNow: number;
    formattedTime: string;
  } | null;
}

export function useValidateEndTime(params: EndTimeValidationParams): EndTimeValidationResult {
  const { value } = params;

  const validationResult = useMemo(() => {
    let endTimeError: string | null = null;
    let unixTimestamp: number | null = null;
    let timeInfo: EndTimeValidationResult["timeInfo"] = null;

    // Check if value is provided
    if (!value || value.trim() === "") {
      endTimeError = "End time is required";
      return {
        endTimeError,
        isValid: false,
        unixTimestamp: null,
        timeInfo: null,
      };
    }

    // Validate date format and create Date object
    const selectedTime = new Date(value);
    if (isNaN(selectedTime.getTime())) {
      endTimeError = "Invalid date format";
      return {
        endTimeError,
        isValid: false,
        unixTimestamp: null,
        timeInfo: null,
      };
    }

    const now = new Date();
    const minTime = new Date(now.getTime() + END_TIME_PARAMS.MIN_HOURS_FROM_NOW * 60 * 60 * 1000);

    // Calculate time differences
    const timeDiffMs = selectedTime.getTime() - now.getTime();
    const hoursFromNow = timeDiffMs / (1000 * 60 * 60);
    const daysFromNow = hoursFromNow / 24;

    // Store time info for display
    timeInfo = {
      hoursFromNow,
      daysFromNow,
      formattedTime: selectedTime.toLocaleString(),
    };

    // Validate time constraints
    if (selectedTime <= now) {
      endTimeError = "End time must be in the future";
    } else if (selectedTime < minTime) {
      endTimeError = `End time must be at least ${END_TIME_PARAMS.MIN_HOURS_FROM_NOW} hours from now`;
    } else {
      // Valid time - calculate unix timestamp
      unixTimestamp = Math.floor(selectedTime.getTime() / 1000);
    }

    return {
      endTimeError,
      isValid: !endTimeError,
      unixTimestamp,
      timeInfo,
    };
  }, [value]);

  return validationResult;
}

// Helper function to get minimum datetime string for datetime-local input
export function getMinDateTime(): string {
  const now = new Date();
  const minTime = new Date(now.getTime() + END_TIME_PARAMS.MIN_HOURS_FROM_NOW * 60 * 60 * 1000);
  return minTime.toISOString().slice(0, 16); // Format for datetime-local input
}
