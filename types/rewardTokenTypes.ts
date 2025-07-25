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

export interface RewardTokenData {
  poolAddress: string;
  poolId: string;
  poolName: string;
  poolSymbol: string;
  gaugeAddress: string;
  version: string;
  rewardTokens: RewardToken[];
}

export interface RewardTokensResponse {
  data: RewardTokenData[];
  network: string;
  timestamp: string;
}