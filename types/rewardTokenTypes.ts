export interface RewardToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  distributor: string;
  rate: string;
  period_finish: string;
  last_update: string;
}

export interface PoolToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isNested: boolean;
  isPhantomBpt: boolean;
}

export interface RewardTokenData {
  poolAddress: string;
  poolId: string;
  poolName: string;
  poolSymbol: string;
  gaugeAddress: string;
  version: string;
  rewardTokens: RewardToken[];
  poolTokens?: PoolToken[];
  totalLiquidity?: string;
}

export interface RewardTokensResponse {
  data: RewardTokenData[];
  network: string;
  timestamp: string;
}