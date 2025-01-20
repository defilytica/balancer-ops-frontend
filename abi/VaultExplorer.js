export const vaultExplorerABI = [
  {
    type: "constructor",
    inputs: [
      { name: "vault", internalType: "contract IVault", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "token", internalType: "address", type: "address" },
      { name: "owner", internalType: "address", type: "address" },
      { name: "spender", internalType: "address", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { name: "tokenAllowance", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "areBuffersPaused",
    outputs: [{ name: "buffersPaused", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "token", internalType: "address", type: "address" },
      { name: "account", internalType: "address", type: "address" },
    ],
    name: "balanceOf",
    outputs: [
      { name: "tokenBalance", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "collectAggregateFees",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "swapParams",
        internalType: "struct PoolSwapParams",
        type: "tuple",
        components: [
          { name: "kind", internalType: "enum SwapKind", type: "uint8" },
          {
            name: "amountGivenScaled18",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "balancesScaled18",
            internalType: "uint256[]",
            type: "uint256[]",
          },
          { name: "indexIn", internalType: "uint256", type: "uint256" },
          { name: "indexOut", internalType: "uint256", type: "uint256" },
          { name: "router", internalType: "address", type: "address" },
          { name: "userData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "computeDynamicSwapFeePercentage",
    outputs: [
      {
        name: "dynamicSwapFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getAddLiquidityCalledFlag",
    outputs: [{ name: "liquidityAdded", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getAggregateFeePercentages",
    outputs: [
      {
        name: "aggregateSwapFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "aggregateYieldFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      { name: "token", internalType: "contract IERC20", type: "address" },
    ],
    name: "getAggregateSwapFeeAmount",
    outputs: [
      { name: "swapFeeAmount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      { name: "token", internalType: "contract IERC20", type: "address" },
    ],
    name: "getAggregateYieldFeeAmount",
    outputs: [
      { name: "yieldFeeAmount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getAuthorizer",
    outputs: [{ name: "authorizer", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getBptRate",
    outputs: [{ name: "rate", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "getBufferAsset",
    outputs: [
      { name: "underlyingToken", internalType: "address", type: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "getBufferBalance",
    outputs: [
      {
        name: "underlyingBalanceRaw",
        internalType: "uint256",
        type: "uint256",
      },
      { name: "wrappedBalanceRaw", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getBufferMinimumTotalSupply",
    outputs: [
      {
        name: "bufferMinimumTotalSupply",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
      { name: "liquidityOwner", internalType: "address", type: "address" },
    ],
    name: "getBufferOwnerShares",
    outputs: [
      { name: "ownerShares", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getBufferPeriodDuration",
    outputs: [
      { name: "bufferPeriodDuration", internalType: "uint32", type: "uint32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getBufferPeriodEndTime",
    outputs: [
      { name: "bufferPeriodEndTime", internalType: "uint32", type: "uint32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "getBufferTotalShares",
    outputs: [
      { name: "bufferShares", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getCurrentLiveBalances",
    outputs: [
      {
        name: "balancesLiveScaled18",
        internalType: "uint256[]",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getHooksConfig",
    outputs: [
      {
        name: "hooksConfig",
        internalType: "struct HooksConfig",
        type: "tuple",
        components: [
          {
            name: "enableHookAdjustedAmounts",
            internalType: "bool",
            type: "bool",
          },
          {
            name: "shouldCallBeforeInitialize",
            internalType: "bool",
            type: "bool",
          },
          {
            name: "shouldCallAfterInitialize",
            internalType: "bool",
            type: "bool",
          },
          {
            name: "shouldCallComputeDynamicSwapFee",
            internalType: "bool",
            type: "bool",
          },
          { name: "shouldCallBeforeSwap", internalType: "bool", type: "bool" },
          { name: "shouldCallAfterSwap", internalType: "bool", type: "bool" },
          {
            name: "shouldCallBeforeAddLiquidity",
            internalType: "bool",
            type: "bool",
          },
          {
            name: "shouldCallAfterAddLiquidity",
            internalType: "bool",
            type: "bool",
          },
          {
            name: "shouldCallBeforeRemoveLiquidity",
            internalType: "bool",
            type: "bool",
          },
          {
            name: "shouldCallAfterRemoveLiquidity",
            internalType: "bool",
            type: "bool",
          },
          { name: "hooksContract", internalType: "address", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getMaximumPoolTokens",
    outputs: [{ name: "maxTokens", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getMinimumPoolTokens",
    outputs: [{ name: "minTokens", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getMinimumTradeAmount",
    outputs: [
      { name: "minimumTradeAmount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getMinimumWrapAmount",
    outputs: [
      { name: "minimumWrapAmount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getNonzeroDeltaCount",
    outputs: [
      { name: "nonzeroDeltaCount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getPauseWindowEndTime",
    outputs: [
      { name: "pauseWindowEndTime", internalType: "uint32", type: "uint32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolConfig",
    outputs: [
      {
        name: "poolConfig",
        internalType: "struct PoolConfig",
        type: "tuple",
        components: [
          {
            name: "liquidityManagement",
            internalType: "struct LiquidityManagement",
            type: "tuple",
            components: [
              {
                name: "disableUnbalancedLiquidity",
                internalType: "bool",
                type: "bool",
              },
              {
                name: "enableAddLiquidityCustom",
                internalType: "bool",
                type: "bool",
              },
              {
                name: "enableRemoveLiquidityCustom",
                internalType: "bool",
                type: "bool",
              },
              { name: "enableDonation", internalType: "bool", type: "bool" },
            ],
          },
          {
            name: "staticSwapFeePercentage",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "aggregateSwapFeePercentage",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "aggregateYieldFeePercentage",
            internalType: "uint256",
            type: "uint256",
          },
          { name: "tokenDecimalDiffs", internalType: "uint40", type: "uint40" },
          {
            name: "pauseWindowEndTime",
            internalType: "uint32",
            type: "uint32",
          },
          { name: "isPoolRegistered", internalType: "bool", type: "bool" },
          { name: "isPoolInitialized", internalType: "bool", type: "bool" },
          { name: "isPoolPaused", internalType: "bool", type: "bool" },
          { name: "isPoolInRecoveryMode", internalType: "bool", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolData",
    outputs: [
      {
        name: "poolData",
        internalType: "struct PoolData",
        type: "tuple",
        components: [
          {
            name: "poolConfigBits",
            internalType: "PoolConfigBits",
            type: "bytes32",
          },
          {
            name: "tokens",
            internalType: "contract IERC20[]",
            type: "address[]",
          },
          {
            name: "tokenInfo",
            internalType: "struct TokenInfo[]",
            type: "tuple[]",
            components: [
              {
                name: "tokenType",
                internalType: "enum TokenType",
                type: "uint8",
              },
              {
                name: "rateProvider",
                internalType: "contract IRateProvider",
                type: "address",
              },
              { name: "paysYieldFees", internalType: "bool", type: "bool" },
            ],
          },
          { name: "balancesRaw", internalType: "uint256[]", type: "uint256[]" },
          {
            name: "balancesLiveScaled18",
            internalType: "uint256[]",
            type: "uint256[]",
          },
          { name: "tokenRates", internalType: "uint256[]", type: "uint256[]" },
          {
            name: "decimalScalingFactors",
            internalType: "uint256[]",
            type: "uint256[]",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getPoolMinimumTotalSupply",
    outputs: [
      {
        name: "poolMinimumTotalSupply",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolPausedState",
    outputs: [
      { name: "poolPaused", internalType: "bool", type: "bool" },
      {
        name: "poolPauseWindowEndTime",
        internalType: "uint32",
        type: "uint32",
      },
      {
        name: "poolBufferPeriodEndTime",
        internalType: "uint32",
        type: "uint32",
      },
      { name: "pauseManager", internalType: "address", type: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolRoleAccounts",
    outputs: [
      {
        name: "roleAccounts",
        internalType: "struct PoolRoleAccounts",
        type: "tuple",
        components: [
          { name: "pauseManager", internalType: "address", type: "address" },
          { name: "swapFeeManager", internalType: "address", type: "address" },
          { name: "poolCreator", internalType: "address", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      { name: "token", internalType: "contract IERC20", type: "address" },
    ],
    name: "getPoolTokenCountAndIndexOfToken",
    outputs: [
      { name: "tokenCount", internalType: "uint256", type: "uint256" },
      { name: "index", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolTokenInfo",
    outputs: [
      { name: "tokens", internalType: "contract IERC20[]", type: "address[]" },
      {
        name: "tokenInfo",
        internalType: "struct TokenInfo[]",
        type: "tuple[]",
        components: [
          { name: "tokenType", internalType: "enum TokenType", type: "uint8" },
          {
            name: "rateProvider",
            internalType: "contract IRateProvider",
            type: "address",
          },
          { name: "paysYieldFees", internalType: "bool", type: "bool" },
        ],
      },
      { name: "balancesRaw", internalType: "uint256[]", type: "uint256[]" },
      {
        name: "lastBalancesLiveScaled18",
        internalType: "uint256[]",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolTokenRates",
    outputs: [
      {
        name: "decimalScalingFactors",
        internalType: "uint256[]",
        type: "uint256[]",
      },
      { name: "tokenRates", internalType: "uint256[]", type: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getPoolTokens",
    outputs: [
      { name: "tokens", internalType: "contract IERC20[]", type: "address[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getProtocolFeeController",
    outputs: [
      {
        name: "protocolFeeController",
        internalType: "address",
        type: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "token", internalType: "contract IERC20", type: "address" },
    ],
    name: "getReservesOf",
    outputs: [
      { name: "reserveAmount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getStaticSwapFeePercentage",
    outputs: [
      { name: "swapFeePercentage", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "token", internalType: "contract IERC20", type: "address" },
    ],
    name: "getTokenDelta",
    outputs: [{ name: "tokenDelta", internalType: "int256", type: "int256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getVault",
    outputs: [{ name: "vault", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getVaultAdmin",
    outputs: [{ name: "vaultAdmin", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getVaultExtension",
    outputs: [
      { name: "vaultExtension", internalType: "address", type: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getVaultPausedState",
    outputs: [
      { name: "vaultPaused", internalType: "bool", type: "bool" },
      {
        name: "vaultPauseWindowEndTime",
        internalType: "uint32",
        type: "uint32",
      },
      {
        name: "vaultBufferPeriodEndTime",
        internalType: "uint32",
        type: "uint32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "isPoolInRecoveryMode",
    outputs: [{ name: "inRecoveryMode", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "isPoolInitialized",
    outputs: [{ name: "initialized", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "isPoolPaused",
    outputs: [{ name: "poolPaused", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "isPoolRegistered",
    outputs: [{ name: "registered", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "isQueryDisabled",
    outputs: [{ name: "queryDisabled", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "isQueryDisabledPermanently",
    outputs: [
      { name: "queryDisabledPermanently", internalType: "bool", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "isUnlocked",
    outputs: [{ name: "unlocked", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "isVaultPaused",
    outputs: [{ name: "vaultPaused", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "token", internalType: "address", type: "address" }],
    name: "totalSupply",
    outputs: [
      { name: "tokenTotalSupply", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
];
