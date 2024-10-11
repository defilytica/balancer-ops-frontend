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
  name?: string;
  logoURI?: string;
  chainId?: number;
}

export interface CoingeckoData {
  name: string;
  symbol: string;
  logoURI?: string;
}
