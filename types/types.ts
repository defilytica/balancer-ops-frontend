import {GAUGE_WEIGHT_CAPS} from "@/constants/constants";

export type NetworkInfo = {
  logo: string;
  rpc: string;
  explorer: string;
  chainId: string;
};

export type PoolType = 'weighted' | 'composableStable' | undefined;

export type WeightCapType = typeof GAUGE_WEIGHT_CAPS[keyof typeof GAUGE_WEIGHT_CAPS];

