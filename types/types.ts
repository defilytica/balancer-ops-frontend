import { GAUGE_WEIGHT_CAPS } from "@/constants/constants";
import { GaugeData, Permission } from "@/types/interfaces";

export type NetworkInfo = {
  logo: string;
  rpc: string;
  explorer: string;
  chainId: string;
};

export type PoolType = "weighted" | "composableStable" | undefined;

export type WeightCapType = (typeof GAUGE_WEIGHT_CAPS)[keyof typeof GAUGE_WEIGHT_CAPS];

// Table: Define the sort direction type
export type SortDirection = "asc" | "desc";

// Table: Define column type for sorting
export type SortableColumn = keyof GaugeData;

export type GaugeNetworkId =
  | "mainnet"
  | "arbitrum"
  | "polygon"
  | "zkevm"
  | "optimism"
  | "avalanche"
  | "base"
  | "gnosis"
  | "fraxtal"
  | "mode"
  | "plasma";

// Permissions types for action interfaces for reducer
export type PermissionsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PERMISSIONS_LOADING"; payload: boolean }
  | {
      type: "SET_ALL_PERMISSIONS";
      payload: { permissions: Permission[]; descriptions: Record<string, string> };
    }
  | { type: "SET_CURRENT_PERMISSIONS"; payload: string[] }
  | { type: "SET_FILTERED_PERMISSIONS"; payload: Permission[] }
  | { type: "TOGGLE_PERMISSION"; payload: string }
  | { type: "REMOVE_PERMISSION"; payload: string }
  | { type: "CLEAR_SELECTED_PERMISSIONS" }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PER_PAGE"; payload: number }
  | { type: "RESET_PERMISSIONS" };
