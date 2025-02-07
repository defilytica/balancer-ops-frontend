export const vaultAdminAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "mainVault", internalType: "contract IVault", type: "address" },
      { name: "pauseWindowDuration", internalType: "uint32", type: "uint32" },
      { name: "bufferPeriodDuration", internalType: "uint32", type: "uint32" },
      { name: "minTradeAmount", internalType: "uint256", type: "uint256" },
      { name: "minWrapAmount", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "error", inputs: [], name: "AfterAddLiquidityHookFailed" },
  { type: "error", inputs: [], name: "AfterInitializeHookFailed" },
  { type: "error", inputs: [], name: "AfterRemoveLiquidityHookFailed" },
  { type: "error", inputs: [], name: "AfterSwapHookFailed" },
  { type: "error", inputs: [], name: "AmountGivenZero" },
  {
    type: "error",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint256", type: "uint256" },
      { name: "maxAmountIn", internalType: "uint256", type: "uint256" },
    ],
    name: "AmountInAboveMax",
  },
  {
    type: "error",
    inputs: [
      { name: "tokenOut", internalType: "contract IERC20", type: "address" },
      { name: "amountOut", internalType: "uint256", type: "uint256" },
      { name: "minAmountOut", internalType: "uint256", type: "uint256" },
    ],
    name: "AmountOutBelowMin",
  },
  { type: "error", inputs: [], name: "BalanceNotSettled" },
  { type: "error", inputs: [], name: "BalanceOverflow" },
  { type: "error", inputs: [], name: "BeforeAddLiquidityHookFailed" },
  { type: "error", inputs: [], name: "BeforeInitializeHookFailed" },
  { type: "error", inputs: [], name: "BeforeRemoveLiquidityHookFailed" },
  { type: "error", inputs: [], name: "BeforeSwapHookFailed" },
  {
    type: "error",
    inputs: [
      { name: "amountIn", internalType: "uint256", type: "uint256" },
      { name: "maxAmountIn", internalType: "uint256", type: "uint256" },
    ],
    name: "BptAmountInAboveMax",
  },
  {
    type: "error",
    inputs: [
      { name: "amountOut", internalType: "uint256", type: "uint256" },
      { name: "minAmountOut", internalType: "uint256", type: "uint256" },
    ],
    name: "BptAmountOutBelowMin",
  },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "BufferAlreadyInitialized",
  },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "BufferNotInitialized",
  },
  { type: "error", inputs: [], name: "BufferSharesInvalidOwner" },
  { type: "error", inputs: [], name: "BufferSharesInvalidReceiver" },
  {
    type: "error",
    inputs: [{ name: "totalSupply", internalType: "uint256", type: "uint256" }],
    name: "BufferTotalSupplyTooLow",
  },
  { type: "error", inputs: [], name: "CannotReceiveEth" },
  { type: "error", inputs: [], name: "CannotSwapSameToken" },
  { type: "error", inputs: [], name: "CodecOverflow" },
  { type: "error", inputs: [], name: "DoesNotSupportAddLiquidityCustom" },
  { type: "error", inputs: [], name: "DoesNotSupportDonation" },
  { type: "error", inputs: [], name: "DoesNotSupportRemoveLiquidityCustom" },
  { type: "error", inputs: [], name: "DoesNotSupportUnbalancedLiquidity" },
  { type: "error", inputs: [], name: "DynamicSwapFeeHookFailed" },
  {
    type: "error",
    inputs: [
      { name: "spender", internalType: "address", type: "address" },
      { name: "allowance", internalType: "uint256", type: "uint256" },
      { name: "needed", internalType: "uint256", type: "uint256" },
    ],
    name: "ERC20InsufficientAllowance",
  },
  {
    type: "error",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      { name: "balance", internalType: "uint256", type: "uint256" },
      { name: "needed", internalType: "uint256", type: "uint256" },
    ],
    name: "ERC20InsufficientBalance",
  },
  {
    type: "error",
    inputs: [{ name: "approver", internalType: "address", type: "address" }],
    name: "ERC20InvalidApprover",
  },
  {
    type: "error",
    inputs: [{ name: "receiver", internalType: "address", type: "address" }],
    name: "ERC20InvalidReceiver",
  },
  {
    type: "error",
    inputs: [{ name: "sender", internalType: "address", type: "address" }],
    name: "ERC20InvalidSender",
  },
  {
    type: "error",
    inputs: [{ name: "spender", internalType: "address", type: "address" }],
    name: "ERC20InvalidSpender",
  },
  { type: "error", inputs: [], name: "FeePrecisionTooHigh" },
  {
    type: "error",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint256", type: "uint256" },
      { name: "maxAmountIn", internalType: "uint256", type: "uint256" },
    ],
    name: "HookAdjustedAmountInAboveMax",
  },
  {
    type: "error",
    inputs: [
      { name: "tokenOut", internalType: "contract IERC20", type: "address" },
      { name: "amountOut", internalType: "uint256", type: "uint256" },
      { name: "minAmountOut", internalType: "uint256", type: "uint256" },
    ],
    name: "HookAdjustedAmountOutBelowMin",
  },
  {
    type: "error",
    inputs: [
      { name: "amount", internalType: "uint256", type: "uint256" },
      { name: "limit", internalType: "uint256", type: "uint256" },
    ],
    name: "HookAdjustedSwapLimit",
  },
  {
    type: "error",
    inputs: [
      { name: "poolHooksContract", internalType: "address", type: "address" },
      { name: "pool", internalType: "address", type: "address" },
      { name: "poolFactory", internalType: "address", type: "address" },
    ],
    name: "HookRegistrationFailed",
  },
  { type: "error", inputs: [], name: "InvalidAddLiquidityKind" },
  { type: "error", inputs: [], name: "InvalidRemoveLiquidityKind" },
  { type: "error", inputs: [], name: "InvalidToken" },
  { type: "error", inputs: [], name: "InvalidTokenConfiguration" },
  { type: "error", inputs: [], name: "InvalidTokenDecimals" },
  { type: "error", inputs: [], name: "InvalidTokenType" },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "InvalidUnderlyingToken",
  },
  {
    type: "error",
    inputs: [
      { name: "issuedShares", internalType: "uint256", type: "uint256" },
      { name: "minIssuedShares", internalType: "uint256", type: "uint256" },
    ],
    name: "IssuedSharesBelowMin",
  },
  { type: "error", inputs: [], name: "MaxTokens" },
  { type: "error", inputs: [], name: "MinTokens" },
  { type: "error", inputs: [], name: "NotEnoughBufferShares" },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
      {
        name: "expectedUnderlyingAmount",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "actualUnderlyingAmount",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "NotEnoughUnderlying",
  },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
      {
        name: "expectedWrappedAmount",
        internalType: "uint256",
        type: "uint256",
      },
      { name: "actualWrappedAmount", internalType: "uint256", type: "uint256" },
    ],
    name: "NotEnoughWrapped",
  },
  { type: "error", inputs: [], name: "NotStaticCall" },
  { type: "error", inputs: [], name: "NotVaultDelegateCall" },
  { type: "error", inputs: [], name: "OutOfBounds" },
  { type: "error", inputs: [], name: "PauseBufferPeriodDurationTooLarge" },
  { type: "error", inputs: [], name: "PercentageAboveMax" },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolAlreadyInitialized",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolAlreadyRegistered",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolInRecoveryMode",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolNotInRecoveryMode",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolNotInitialized",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolNotPaused",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolNotRegistered",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolPauseWindowExpired",
  },
  {
    type: "error",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "PoolPaused",
  },
  {
    type: "error",
    inputs: [{ name: "totalSupply", internalType: "uint256", type: "uint256" }],
    name: "PoolTotalSupplyTooLow",
  },
  { type: "error", inputs: [], name: "ProtocolFeesExceedTotalCollected" },
  { type: "error", inputs: [], name: "QueriesDisabled" },
  { type: "error", inputs: [], name: "QueriesDisabledPermanently" },
  { type: "error", inputs: [], name: "QuoteResultSpoofed" },
  { type: "error", inputs: [], name: "ReentrancyGuardReentrantCall" },
  { type: "error", inputs: [], name: "RouterNotTrusted" },
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
    inputs: [{ name: "value", internalType: "uint256", type: "uint256" }],
    name: "SafeCastOverflowedUintToInt",
  },
  {
    type: "error",
    inputs: [{ name: "sender", internalType: "address", type: "address" }],
    name: "SenderIsNotVault",
  },
  { type: "error", inputs: [], name: "SenderNotAllowed" },
  { type: "error", inputs: [], name: "SwapFeePercentageTooHigh" },
  { type: "error", inputs: [], name: "SwapFeePercentageTooLow" },
  {
    type: "error",
    inputs: [
      { name: "amount", internalType: "uint256", type: "uint256" },
      { name: "limit", internalType: "uint256", type: "uint256" },
    ],
    name: "SwapLimit",
  },
  {
    type: "error",
    inputs: [{ name: "token", internalType: "contract IERC20", type: "address" }],
    name: "TokenAlreadyRegistered",
  },
  {
    type: "error",
    inputs: [{ name: "token", internalType: "contract IERC20", type: "address" }],
    name: "TokenNotRegistered",
  },
  {
    type: "error",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      { name: "expectedToken", internalType: "address", type: "address" },
      { name: "actualToken", internalType: "address", type: "address" },
    ],
    name: "TokensMismatch",
  },
  { type: "error", inputs: [], name: "TradeAmountTooSmall" },
  { type: "error", inputs: [], name: "VaultBuffersArePaused" },
  { type: "error", inputs: [], name: "VaultIsNotUnlocked" },
  { type: "error", inputs: [], name: "VaultNotPaused" },
  { type: "error", inputs: [], name: "VaultPauseWindowDurationTooLarge" },
  { type: "error", inputs: [], name: "VaultPauseWindowExpired" },
  { type: "error", inputs: [], name: "VaultPaused" },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "WrapAmountTooSmall",
  },
  { type: "error", inputs: [], name: "WrongProtocolFeeControllerDeployment" },
  {
    type: "error",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
      { name: "underlyingToken", internalType: "address", type: "address" },
    ],
    name: "WrongUnderlyingToken",
  },
  { type: "error", inputs: [], name: "WrongVaultAdminDeployment" },
  { type: "error", inputs: [], name: "WrongVaultExtensionDeployment" },
  { type: "error", inputs: [], name: "ZeroDivision" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "aggregateSwapFeePercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "AggregateSwapFeePercentageChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "aggregateYieldFeePercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "AggregateYieldFeePercentageChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "spender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "value",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Approval",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "newAuthorizer",
        internalType: "contract IAuthorizer",
        type: "address",
        indexed: true,
      },
    ],
    name: "AuthorizerChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
        indexed: true,
      },
      { name: "from", internalType: "address", type: "address", indexed: true },
      {
        name: "burnedShares",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "BufferSharesBurned",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
        indexed: true,
      },
      { name: "to", internalType: "address", type: "address", indexed: true },
      {
        name: "issuedShares",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "BufferSharesMinted",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "liquidityProvider",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "kind",
        internalType: "enum AddLiquidityKind",
        type: "uint8",
        indexed: true,
      },
      {
        name: "totalSupply",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "amountsAddedRaw",
        internalType: "uint256[]",
        type: "uint256[]",
        indexed: false,
      },
      {
        name: "swapFeeAmountsRaw",
        internalType: "uint256[]",
        type: "uint256[]",
        indexed: false,
      },
    ],
    name: "LiquidityAdded",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
        indexed: true,
      },
      {
        name: "amountUnderlying",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "amountWrapped",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "bufferBalances",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false,
      },
    ],
    name: "LiquidityAddedToBuffer",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "liquidityProvider",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "kind",
        internalType: "enum RemoveLiquidityKind",
        type: "uint8",
        indexed: true,
      },
      {
        name: "totalSupply",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "amountsRemovedRaw",
        internalType: "uint256[]",
        type: "uint256[]",
        indexed: false,
      },
      {
        name: "swapFeeAmountsRaw",
        internalType: "uint256[]",
        type: "uint256[]",
        indexed: false,
      },
    ],
    name: "LiquidityRemoved",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
        indexed: true,
      },
      {
        name: "amountUnderlying",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "amountWrapped",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "bufferBalances",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false,
      },
    ],
    name: "LiquidityRemovedFromBuffer",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [{ name: "pool", internalType: "address", type: "address", indexed: true }],
    name: "PoolInitialized",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      { name: "paused", internalType: "bool", type: "bool", indexed: false },
    ],
    name: "PoolPausedStateChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "recoveryMode",
        internalType: "bool",
        type: "bool",
        indexed: false,
      },
    ],
    name: "PoolRecoveryModeStateChanged",
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
      {
        name: "tokenConfig",
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
        indexed: false,
      },
      {
        name: "swapFeePercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "pauseWindowEndTime",
        internalType: "uint32",
        type: "uint32",
        indexed: false,
      },
      {
        name: "roleAccounts",
        internalType: "struct PoolRoleAccounts",
        type: "tuple",
        components: [
          { name: "pauseManager", internalType: "address", type: "address" },
          { name: "swapFeeManager", internalType: "address", type: "address" },
          { name: "poolCreator", internalType: "address", type: "address" },
        ],
        indexed: false,
      },
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
        indexed: false,
      },
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
        indexed: false,
      },
    ],
    name: "PoolRegistered",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "newProtocolFeeController",
        internalType: "contract IProtocolFeeController",
        type: "address",
        indexed: true,
      },
    ],
    name: "ProtocolFeeControllerChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "tokenIn",
        internalType: "contract IERC20",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenOut",
        internalType: "contract IERC20",
        type: "address",
        indexed: true,
      },
      {
        name: "amountIn",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "amountOut",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "swapFeePercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "swapFeeAmount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Swap",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "swapFeePercentage",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "SwapFeePercentageChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      { name: "from", internalType: "address", type: "address", indexed: true },
      { name: "to", internalType: "address", type: "address", indexed: true },
      {
        name: "value",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Transfer",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
        indexed: true,
      },
      {
        name: "burnedShares",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "withdrawnUnderlying",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "bufferBalances",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false,
      },
    ],
    name: "Unwrap",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "pool", internalType: "address", type: "address", indexed: true },
      {
        name: "eventKey",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "eventData",
        internalType: "bytes",
        type: "bytes",
        indexed: false,
      },
    ],
    name: "VaultAuxiliary",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [{ name: "paused", internalType: "bool", type: "bool", indexed: false }],
    name: "VaultBuffersPausedStateChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [{ name: "paused", internalType: "bool", type: "bool", indexed: false }],
    name: "VaultPausedStateChanged",
  },
  { type: "event", anonymous: false, inputs: [], name: "VaultQueriesDisabled" },
  { type: "event", anonymous: false, inputs: [], name: "VaultQueriesEnabled" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
        indexed: true,
      },
      {
        name: "depositedUnderlying",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "mintedShares",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "bufferBalances",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false,
      },
    ],
    name: "Wrap",
  },
  { type: "fallback", stateMutability: "payable" },
  {
    type: "function",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
      {
        name: "maxAmountUnderlyingInRaw",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "maxAmountWrappedInRaw",
        internalType: "uint256",
        type: "uint256",
      },
      { name: "exactSharesToIssue", internalType: "uint256", type: "uint256" },
      { name: "sharesOwner", internalType: "address", type: "address" },
    ],
    name: "addLiquidityToBuffer",
    outputs: [
      { name: "amountUnderlyingRaw", internalType: "uint256", type: "uint256" },
      { name: "amountWrappedRaw", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "areBuffersPaused",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "collectAggregateFees",
    outputs: [
      { name: "totalSwapFees", internalType: "uint256[]", type: "uint256[]" },
      { name: "totalYieldFees", internalType: "uint256[]", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "disableQuery",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "disableQueryPermanently",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "disableRecoveryMode",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "enableQuery",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "enableRecoveryMode",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
    ],
    name: "getBufferAsset",
    outputs: [{ name: "underlyingToken", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "token", internalType: "contract IERC4626", type: "address" }],
    name: "getBufferBalance",
    outputs: [
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getBufferMinimumTotalSupply",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    inputs: [
      { name: "token", internalType: "contract IERC4626", type: "address" },
      { name: "user", internalType: "address", type: "address" },
    ],
    name: "getBufferOwnerShares",
    outputs: [{ name: "shares", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getBufferPeriodDuration",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getBufferPeriodEndTime",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "token", internalType: "contract IERC4626", type: "address" }],
    name: "getBufferTotalShares",
    outputs: [{ name: "shares", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getMaximumPoolTokens",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    inputs: [],
    name: "getMinimumPoolTokens",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    inputs: [],
    name: "getMinimumTradeAmount",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getMinimumWrapAmount",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getPauseWindowEndTime",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getPoolMinimumTotalSupply",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    inputs: [],
    name: "getVaultPausedState",
    outputs: [
      { name: "", internalType: "bool", type: "bool" },
      { name: "", internalType: "uint32", type: "uint32" },
      { name: "", internalType: "uint32", type: "uint32" },
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
      { name: "amountUnderlyingRaw", internalType: "uint256", type: "uint256" },
      { name: "amountWrappedRaw", internalType: "uint256", type: "uint256" },
      { name: "minIssuedShares", internalType: "uint256", type: "uint256" },
      { name: "sharesOwner", internalType: "address", type: "address" },
    ],
    name: "initializeBuffer",
    outputs: [{ name: "issuedShares", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "isVaultPaused",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "pausePool",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "pauseVault",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "pauseVaultBuffers",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "reentrancyGuardEntered",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
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
      { name: "sharesToRemove", internalType: "uint256", type: "uint256" },
      {
        name: "minAmountUnderlyingOutRaw",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "minAmountWrappedOutRaw",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "removeLiquidityFromBuffer",
    outputs: [
      {
        name: "removedUnderlyingBalanceRaw",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "removedWrappedBalanceRaw",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "wrappedToken",
        internalType: "contract IERC4626",
        type: "address",
      },
      { name: "sharesToRemove", internalType: "uint256", type: "uint256" },
      {
        name: "minAmountUnderlyingOutRaw",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "minAmountWrappedOutRaw",
        internalType: "uint256",
        type: "uint256",
      },
      { name: "sharesOwner", internalType: "address", type: "address" },
    ],
    name: "removeLiquidityFromBufferHook",
    outputs: [
      {
        name: "removedUnderlyingBalanceRaw",
        internalType: "uint256",
        type: "uint256",
      },
      {
        name: "removedWrappedBalanceRaw",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "newAuthorizer",
        internalType: "contract IAuthorizer",
        type: "address",
      },
    ],
    name: "setAuthorizer",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "newProtocolFeeController",
        internalType: "contract IProtocolFeeController",
        type: "address",
      },
    ],
    name: "setProtocolFeeController",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      { name: "swapFeePercentage", internalType: "uint256", type: "uint256" },
    ],
    name: "setStaticSwapFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "pool", internalType: "address", type: "address" }],
    name: "unpausePool",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "unpauseVault",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "unpauseVaultBuffers",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "newAggregateSwapFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "updateAggregateSwapFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      {
        name: "newAggregateYieldFeePercentage",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "updateAggregateYieldFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "vault",
    outputs: [{ name: "", internalType: "contract IVault", type: "address" }],
    stateMutability: "view",
  },
  { type: "receive", stateMutability: "payable" },
];
