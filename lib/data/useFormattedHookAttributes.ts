import { useMemo } from "react";
import { Pool, HookParams, StableSurgeHookParams } from "@/types/interfaces";

// Type guard for StableSurgeHookParams
const isStableSurgeHookParams = (params?: HookParams): params is StableSurgeHookParams => {
  if (!params) return false;
  return (
    params.__typename === "StableSurgeHookParams" ||
    ("maxSurgeFeePercentage" in params && "surgeThresholdPercentage" in params)
  );
};

export function useFormattedHookAttributes(pool: Pool | null) {
  return useMemo(() => {
    if (!pool || !pool.hook) return [];

    const baseAttributes = [{ title: "Hook Address", value: pool.hook.address }];

    // Add hook-specific attributes based on hook type
    let specificAttributes: { title: string; value: string }[] = [];

    if (
      pool.hook.type === "STABLE_SURGE" &&
      pool.hook.params &&
      isStableSurgeHookParams(pool.hook.params)
    ) {
      specificAttributes = [
        {
          title: "Max Surge Fee",
          value: `${(parseFloat(pool.hook.params.maxSurgeFeePercentage) * 100).toFixed(2)}%`,
        },
        {
          title: "Surge Threshold",
          value: `${(parseFloat(pool.hook.params.surgeThresholdPercentage) * 100).toFixed(2)}%`,
        },
      ];
    }

    // Add other hook types here as needed

    // Filter out attributes with empty values and return
    return [...baseAttributes, ...specificAttributes].filter(({ value }) => value != null);
  }, [pool]);
}
