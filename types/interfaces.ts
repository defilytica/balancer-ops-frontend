import {PoolType} from "@/types/types";

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
  owner: string;
  dynamicData: {
    swapFee: string;
    poolId: string;
  };
}

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

export interface PoolConfig {
  type: PoolType;
  tokens: PoolToken[];
  weights?: number[]; // For weighted pools
  amplificationFactor?: number; // For stable pools
  // Add other pool-specific configurations
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
  amount: string;
  decimals?: number;
  logoURI?: string;
  name?: string;
}

//TODO: Refactor token interface!
export interface TokenListToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

export interface GetTokensQuery {
  tokenGetTokens: TokenListToken[];
}

export interface GetTokensQueryVariables {
  chainIn: string[];
}
