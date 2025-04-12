import { useMemo } from "react";
import { Pool } from "@/types/interfaces";
import { isMevTaxHookParams } from "@/components/MevCaptureHookConfigurationModule";
import { isStableSurgeHookParams } from "@/components/StableSurgeHookConfigurationModule";
import { formatGwei, parseEther } from "viem";

export function formatHookAttributes(pool: Pool | null, withAddress = true) {
  if (!pool || !pool.hook) return [];

  const baseAttributes = [{ title: "Hook Address", value: pool.hook.address }];

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

  if (pool.hook.type === "MEV_TAX" && pool.hook.params && isMevTaxHookParams(pool.hook.params)) {
    specificAttributes = [
      {
        title: "Mev Tax Threshold",
        value: `${formatGwei(parseEther(pool.hook.params.mevTaxThreshold))} Gwei`,
      },
      {
        title: "Mev Tax Multiplier",
        value: (Number(pool.hook.params.mevTaxMultiplier) / 1e6).toString(),
      },
    ];
  }

  // Return either all attributes or just specific attributes based on withAddress parameter
  const attributes = withAddress ? [...baseAttributes, ...specificAttributes] : specificAttributes;
  return attributes.filter(({ value }) => value != null);
}

export function useFormattedHookAttributes(pool: Pool | null, withAddress = true) {
  return useMemo(() => formatHookAttributes(pool, withAddress), [pool, withAddress]);
}
