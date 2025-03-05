import { PoolType } from "@/types/types";

export interface AddressBook {
  active: {
    [network: string]: {
      [category: string]: {
        [subcategory: string]:
          | string
          | {
              [key: string]: string;
            };
      };
    };
  };
}

export interface ChainlinkData {
  blockchain: string;
  upkeep_name: string;
  upkeep_status: string;
  upkeep_balance: number;
  total_link_payments: number;
  total_performs: number;
  link_per_perform: number;
  upkeep_url: string;
  estimated_actions_left: number;
}

export type AddressOption = {
  network: string;
  address: string;
  token: string;
};

export interface Pool {
  chain: string;
  protocolVersion: string;
  address: string;
  name: string;
  symbol: string;
  type: string;
  version: string;
  createTime: string;
  swapFeeManager: string;
  tags: string[];
  poolTokens: PoolToken[];
  staking: {
    gauge: {
      id: string;
    };
  };
  dynamicData: {
    swapFee: string;
    poolId: string;
    totalLiquidity: string;
  };
}

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

export interface PoolConfig {
  poolId?: string;
  poolAddress?: string;
  type?: PoolType;
  tokens: PoolToken[];
  settings?: PoolSettings;
}

export interface Token {
  address: string;
  weight?: number;
  symbol: string;
  balance: string;
}

export interface PoolToken {
  address: string;
  weight: number;
  symbol: string;
  amount?: string;
  decimals?: number;
  logoURI?: string;
  name?: string;
  rateProvider?: string;
  price?: number;
  chain?: string;
  isErc4626?: boolean;
  underlyingToken?: UnderlyingToken;
}

export interface UnderlyingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  isErc4626: boolean;
}

//TODO: Refactor token interface!
export interface TokenListToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  isErc4626?: boolean;
  underlyingTokenAddress?: string;
}

export interface TokenWithBalance extends PoolToken {
  balance?: string;
  formattedBalance?: string;
  locked?: boolean;
}

export interface GetTokensQuery {
  tokenGetTokens: TokenListToken[];
}

export interface GetTokensQueryVariables {
  chainIn: string[];
  tokensIn?: string[];
}

export interface WeightedPoolSpecific {
  feeManagement: {
    type: "fixed" | "governance" | "custom";
    customOwner?: string;
    owner?: string;
  };
}

export interface StablePoolSpecific {
  amplificationParameter: number;
  rateCacheDuration: string;
  yieldFeeExempt: boolean;
  feeManagement: {
    type: "fixed" | "governance" | "custom";
    customOwner?: string;
    owner?: string;
  };
}

export interface PoolSettings {
  swapFee: number;
  name: string;
  symbol: string;
  weightedSpecific?: WeightedPoolSpecific;
  stableSpecific?: StablePoolSpecific;
}

export interface DuneResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result: DuneResult;
}

export interface DuneResult {
  rows: GaugeData[];
  metadata: {
    column_names: string[];
    result_set_bytes: number;
    total_row_count: number;
    datapoint_count: number;
    pending_execution_row_count: number;
  };
}

export interface GaugeData {
  gauge: string;
  symbol: string;
  status: string;
  last_round_id: number;
  last_vote_date: string;
  days_since_last_vote: number;
  last_vote_amount: number;
  last_vote_percentage: number;
  median_60d_tvl: number;
  avg_60d_tvl: number;
  max_60d_tvl: number;
  min_60d_tvl: number;
  days_above_100k_tvl: number;
  last_day_above_100k: number;
}
