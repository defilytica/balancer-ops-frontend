export const stableSurgeHookAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "vault", internalType: "contract IVault", type: "address" },
      {
        name: "defaultMaxSurgeFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "defaultSurgeThresholdPercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  { type: "error", inputs: [], name: "InputLengthMismatch" },
  { type: "error", inputs: [], name: "InvalidPercentage" },
  {
    type: "error",
    inputs: [
      { name: "bits", internalType: "uint8", type: "uint8" },
      { name: "value", internalType: "uint256", type: "uint256" },
    ],
    name: "SafeCastOverflowedUintDowncast",
  },
  {
    type: "error",
    inputs: [{ name: "sender", internalType: "address", type: "address" }],
    name: "SenderIsNotVault",
  },
  { type: "error", inputs: [], name: "SenderNotAllowed" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "newMaxSurgeFeePercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "MaxSurgeFeePercentageChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "factory",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "StableSurgeHookRegistered",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "newSurgeThresholdPercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "ThresholdSurgePercentageChanged",
  },
  {
    type: "function",
    inputs: [{ name: "selector", internalType: "bytes4", type: "bytes4" }],
    name: "getActionId",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getAllowedPoolFactory",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getAuthorizer",
    outputs: [{ name: "", internalType: "contract IAuthorizer", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getDefaultMaxSurgeFeePercentage",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getDefaultSurgeThresholdPercentage",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getHookFlags",
    outputs: [
      {
        name: "hookFlags",
        internalType: "struct HookFlags",
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
        ],
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getMaxSurgeFeePercentage",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
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
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "staticSwapFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "getSurgeFeePercentage",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "getSurgeThresholdPercentage",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getVault",
    outputs: [{ name: "", internalType: "contract IVault", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "pool", internalType: "address", type: "address" },
      { name: "kind", internalType: "enum AddLiquidityKind", type: "uint8" },
      {
        name: "amountsInScaled18",
        internalType: "uint256[]",
        type: "uint256[]",
      },
      { name: "amountsInRaw", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256", type: "uint256" },
      {
        name: "balancesScaled18",
        internalType: "uint256[]",
        type: "uint256[]",
      },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onAfterAddLiquidity",
    outputs: [
      { name: "success", internalType: "bool", type: "bool" },
      {
        name: "hookAdjustedAmountsInRaw",
        internalType: "uint256[]",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onAfterInitialize",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "pool", internalType: "address", type: "address" },
      { name: "kind", internalType: "enum RemoveLiquidityKind", type: "uint8" },
      { name: "", internalType: "uint256", type: "uint256" },
      {
        name: "amountsOutScaled18",
        internalType: "uint256[]",
        type: "uint256[]",
      },
      { name: "amountsOutRaw", internalType: "uint256[]", type: "uint256[]" },
      {
        name: "balancesScaled18",
        internalType: "uint256[]",
        type: "uint256[]",
      },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onAfterRemoveLiquidity",
    outputs: [
      { name: "success", internalType: "bool", type: "bool" },
      {
        name: "hookAdjustedAmountsOutRaw",
        internalType: "uint256[]",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "",
        internalType: "struct AfterSwapParams",
        type: "tuple",
        components: [
          { name: "kind", internalType: "enum SwapKind", type: "uint8" },
          { name: "tokenIn", internalType: "contract IERC20", type: "address" },
          {
            name: "tokenOut",
            internalType: "contract IERC20",
            type: "address",
          },
          {
            name: "amountInScaled18",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "amountOutScaled18",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "tokenInBalanceScaled18",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "tokenOutBalanceScaled18",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "amountCalculatedScaled18",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "amountCalculatedRaw",
            internalType: "uint256",
            type: "uint256",
          },
          { name: "router", internalType: "address", type: "address" },
          { name: "pool", internalType: "address", type: "address" },
          { name: "userData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "onAfterSwap",
    outputs: [
      { name: "", internalType: "bool", type: "bool" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "enum AddLiquidityKind", type: "uint8" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onBeforeAddLiquidity",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onBeforeInitialize",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "enum RemoveLiquidityKind", type: "uint8" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onBeforeRemoveLiquidity",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "",
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
      { name: "", internalType: "address", type: "address" },
    ],
    name: "onBeforeSwap",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
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
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "staticSwapFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "onComputeDynamicSwapFeePercentage",
    outputs: [
      { name: "", internalType: "bool", type: "bool" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "factory", internalType: "address", type: "address" },
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "",
        internalType: "struct TokenConfig[]",
        type: "tuple[]",
        components: [
          { name: "token", internalType: "contract IERC20", type: "address" },
          { name: "tokenType", internalType: "enum TokenType", type: "uint8" },
          {
            name: "rateProvider",
            internalType: "contract IRateProvider",
            type: "address",
          },
          { name: "paysYieldFees", internalType: "bool", type: "bool" },
        ],
      },
      {
        name: "",
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
    ],
    name: "onRegister",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "newMaxSurgeSurgeFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "setMaxSurgeFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "newSurgeThresholdPercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "setSurgeThresholdPercentage",
    outputs: [],
    stateMutability: "nonpayable",
  },
];
