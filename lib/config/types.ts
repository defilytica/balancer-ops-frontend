//TODO: Global type from API?
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

export interface FormattedAttribute {
  title: string;
  value: string;
}
