import { GAUGE_WEIGHT_CAPS } from "@/constants/constants";
import { GaugeData } from "@/types/interfaces";

export type NetworkInfo = {
  logo: string;
  rpc: string;
  explorer: string;
  chainId: string;
};

export type PoolType = "weighted" | "composableStable" | undefined;

export type WeightCapType = (typeof GAUGE_WEIGHT_CAPS)[keyof typeof GAUGE_WEIGHT_CAPS];

// Table: Define the sort direction type
export type SortDirection = 'asc' | 'desc';

// Table: Define column type for sorting
export type SortableColumn = keyof GaugeData;

export type GaugeNetworkId = 'mainnet' | 'arbitrum' | 'polygon' | 'zkevm' | 'optimism' | 'avalanche' | 'base' | 'gnosis' | 'fraxtal' | 'mode';
