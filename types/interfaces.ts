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
  id: string;
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
    volume24h?: string;
  };
  hook?: Hook;
}

export interface ReClammPool extends Pool {
  centerednessMargin: string;
  currentFourthRootPriceRatio: string;
  dailyPriceShiftBase: string;
  endFourthRootPriceRatio: string;
  hasAnyAllowedBuffer: boolean;
  lastTimestamp: string;
  lastVirtualBalances: string[];
  priceRatioUpdateEndTime: string;
  priceRatioUpdateStartTime: string;
  startFourthRootPriceRatio: string;
}

export interface ReClammContractData {
  priceRange: string[];
  virtualBalances: {
    virtualBalanceA: string;
    virtualBalanceB: string;
  };
  liveBalances: {
    liveBalanceA: string;
    liveBalanceB: string;
  };
  centerednessMargin: string;
  isPoolWithinTargetRange: boolean;
  dailyPriceShiftExponent: string;
  currentPriceRatio: string;
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
  useUnderlyingForAddRemove?: boolean;
  underlyingToken?: UnderlyingToken;
  balance?: string;
  balanceUSD?: string;
}

export interface UnderlyingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  isErc4626: boolean;
}

export interface TokenListToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  isErc4626?: boolean;
  underlyingTokenAddress?: string;
  isManual?: boolean;
  chain?: string;
}

export interface BufferData {
  isInitialized?: boolean;
  balancePercentage?: number;
  underlyingBalance?: bigint;
  wrappedBalance?: bigint;
  loading: boolean;
  error?: boolean;
}

export interface TokenWithBufferData extends TokenListToken {
  bufferData: BufferData;
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

// Base interface for hook params
export interface BaseHookParams {
  __typename?: string;
}

export interface ExitFeeHookParams extends BaseHookParams {
  __typename?: "ExitFeeHookParams";
  exitFeePercentage: string;
}

export interface FeeTakingHookParams extends BaseHookParams {
  __typename?: "FeeTakingHookParams";
  addLiquidityFeePercentage: string;
  removeLiquidityFeePercentage: string;
  swapFeePercentage: string;
}

export interface MevTaxHookParams extends BaseHookParams {
  __typename?: "MevTaxHookParams";
  mevTaxThreshold: string;
  mevTaxMultiplier: string;
  maxMevSwapFeePercentage: string;
}

export interface StableSurgeHookParams extends BaseHookParams {
  __typename?: "StableSurgeHookParams";
  maxSurgeFeePercentage: string;
  surgeThresholdPercentage: string;
}

// Union type for all possible hook params
export type HookParams =
  | ExitFeeHookParams
  | FeeTakingHookParams
  | MevTaxHookParams
  | StableSurgeHookParams;

export interface Hook {
  address: string;
  type: string;
  params?: HookParams;
}

export interface GaugeRecipientData {
  id: string;
  gaugeId: string | null;
  isKilled: boolean;
  relativeWeightCap: number;
}

// Permissions Builder
export interface Permission {
  actionId: string;
  description: string;
  deployment: string;
  selected: boolean;
}

export interface Permissions {
  [actionId: string]: string[] | { [address: string]: boolean };
}

export interface ReverseAddressBook {
  [address: string]: string;
}

export interface ActionIdsData {
  [deployment: string]: {
    [contract: string]: {
      useAdaptor: boolean;
      actionIds: {
        [functionName: string]: string;
      };
    };
  };
}

export interface FormattedDeployment {
  name: string;
  date: string;
  version: string;
}

export interface AddressTypeData {
  address: string;
  type: "EOA" | "SafeProxy" | "Contract";
}

// EOA simulation types

export interface SimulationResult {
  url: string | null;
  success: boolean;
}

export interface SimulationTransaction {
  to: string;
  data: string;
  value?: string;
}

export enum BufferOperation {
  ADD = "add",
  REMOVE = "remove",
}

export interface ManageBufferSimulationTransactionsParams {
  selectedToken: TokenListToken;
  selectedNetwork: string;
  sharesAmount: string;
  operationType: BufferOperation;
  wrappedTokenAmount?: string;
  underlyingTokenAmount?: string;
  underlyingTokenAddress?: string;
  addressBook: AddressBook;
}

export interface InitializeBufferSimulationTransactionsParams {
  selectedToken: TokenListToken;
  selectedNetwork: string;
  exactAmountWrappedIn?: string;
  exactAmountUnderlyingIn?: string;
  underlyingTokenAddress?: string;
  minIssuedShares?: string;
  addressBook: AddressBook;
}

export interface ChangeSwapFeeV3SimulationTransactionsParams {
  selectedPool: Pool;
  newSwapFeePercentage: string;
}

export interface ReClammParameterSimulationTransactionsParams {
  selectedPool: Pool;
  hasCenterednessMargin: boolean;
  hasDailyPriceShiftExponent: boolean;
  hasPriceRatioUpdate: boolean;
  centerednessMargin?: string;
  dailyPriceShiftExponent?: string;
  endPriceRatio?: string;
  priceRatioUpdateStartTime?: string;
  priceRatioUpdateEndTime?: string;
}

export interface StableSurgeParameterSimulationTransactionsParams {
  selectedPool: Pool;
  hasMaxSurgeFeePercentage: boolean;
  hasSurgeThresholdPercentage: boolean;
  maxSurgeFeePercentage?: string;
  surgeThresholdPercentage?: string;
}

export interface MevCaptureParameterSimulationTransactionsParams {
  selectedPool: Pool;
  hasMevTaxThreshold: boolean;
  hasMevTaxMultiplier: boolean;
  mevTaxThreshold?: string;
  mevTaxMultiplier?: string;
}
