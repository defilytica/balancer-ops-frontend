import { useMemo } from "react";
import { Pool } from "@/types/interfaces";

export function useFormattedPoolAttributes(pool: Pool | null) {
  return useMemo(() => {
    if (!pool) return [];

    return [
      { title: "Chain", value: pool.chain },
      { title: "Protocol Version", value: pool.protocolVersion },
      { title: "Address", value: pool.address },
      { title: "Symbol", value: pool.symbol },
      { title: "Type", value: pool.type },
      { title: "Version", value: pool.version },
      {
        title: "Create Time",
        value: new Date(parseInt(pool.createTime) * 1000).toLocaleString(),
      },
      { title: "Owner", value: pool.swapFeeManager },
      {
        title: "Swap Fee",
        value: `${parseFloat(pool.dynamicData.swapFee) * 100}%`,
      },
      { title: "Pool ID", value: pool.dynamicData.poolId },
    ].filter(attribute => attribute.value !== undefined && attribute.value !== null);
  }, [pool]);
}
