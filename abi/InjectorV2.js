export const InjectorABIV2 = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "AddressInsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "gaugeAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountsPerPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxInjectionAmount",
        type: "uint256",
      },
    ],
    name: "ExceedsMaxInjectionAmount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "totalDue",
        type: "uint256",
      },
    ],
    name: "ExceedsTotalInjectorProgramBudget",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "weeklySpend",
        type: "uint256",
      },
    ],
    name: "ExceedsWeeklySpend",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedInnerCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "gauge",
        type: "address",
      },
      {
        internalType: "address",
        name: "InjectTokenAddress",
        type: "address",
      },
    ],
    name: "InjectorNotDistributor",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "OnlyKeepers",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "gaugeAddress",
        type: "address",
      },
    ],
    name: "RemoveNonexistentRecipient",
    type: "error",
  },
  {
    inputs: [],
    name: "RewardTokenError",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "ERC20Swept",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "EmissionsInjection",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "keeperAddresses",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minWaitPeriodSeconds",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "injectTokenAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxInjectionAmount",
        type: "uint256",
      },
    ],
    name: "InjectorInitialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "oldAddresses",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "newAddresses",
        type: "address[]",
      },
    ],
    name: "KeeperRegistryAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newAmount",
        type: "uint256",
      },
    ],
    name: "MaxGlobalAmountPerPeriodUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newAmount",
        type: "uint256",
      },
    ],
    name: "MaxInjectionAmountUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newAmount",
        type: "uint256",
      },
    ],
    name: "MaxTotalDueUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldMinWaitPeriod",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newMinWaitPeriod",
        type: "uint256",
      },
    ],
    name: "MinWaitPeriodUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "needsFunding",
        type: "address[]",
      },
    ],
    name: "PerformedUpkeep",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "gaugeAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountPerPeriod",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxPeriods",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "periodsExecutedLastProgram",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint56",
        name: "doNotStartBeforeTimestamp",
        type: "uint56",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "seenBefore",
        type: "bool",
      },
    ],
    name: "RecipientAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "gaugeAddress",
        type: "address",
      },
    ],
    name: "RecipientRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SetHandlingToken",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "InjectTokenAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "KeeperAddresses",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MaxGlobalAmountPerPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MaxInjectionAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MaxTotalDue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MinWaitPeriodSeconds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "amountPerPeriod",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "maxPeriods",
        type: "uint8",
      },
      {
        internalType: "uint56",
        name: "doNotStartBeforeTimestamp",
        type: "uint56",
      },
    ],
    name: "addRecipients",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "gauge",
        type: "address",
      },
      {
        internalType: "address",
        name: "reward_token",
        type: "address",
      },
      {
        internalType: "address",
        name: "distributor",
        type: "address",
      },
    ],
    name: "changeDistributor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "checkUpkeep",
    outputs: [
      {
        internalType: "bool",
        name: "upkeepNeeded",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "performData",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "estimateSpendUntilTimestamp",
    outputs: [
      {
        internalType: "uint256",
        name: "spendUntilTimestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveGaugeList",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalanceDelta",
    outputs: [
      {
        internalType: "int256",
        name: "delta",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getFullSchedule",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "uint8[]",
        name: "",
        type: "uint8[]",
      },
      {
        internalType: "uint8[]",
        name: "",
        type: "uint8[]",
      },
      {
        internalType: "uint56[]",
        name: "",
        type: "uint56[]",
      },
      {
        internalType: "uint56[]",
        name: "",
        type: "uint56[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "targetAddress",
        type: "address",
      },
    ],
    name: "getGaugeInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "amountPerPeriod",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
      {
        internalType: "uint8",
        name: "maxPeriods",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "periodNumber",
        type: "uint8",
      },
      {
        internalType: "uint56",
        name: "lastInjectionTimestamp",
        type: "uint56",
      },
      {
        internalType: "uint56",
        name: "doNotStartBeforeTimestamp",
        type: "uint56",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getKeeperAddresses",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReadyGauges",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalDue",
    outputs: [
      {
        internalType: "uint256",
        name: "totalDue",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getWeeklySpend",
    outputs: [
      {
        internalType: "uint256",
        name: "weeklySpend",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "keeperAddresses",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "minWaitPeriodSeconds",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "injectTokenAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "maxInjectionAmount",
        type: "uint256",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "gauges",
        type: "address[]",
      },
    ],
    name: "injectFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "gauge",
        type: "address",
      },
      {
        internalType: "address",
        name: "reward_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "manualDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "performData",
        type: "bytes",
      },
    ],
    name: "performUpkeep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
    ],
    name: "removeRecipients",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "keeperAddresses",
        type: "address[]",
      },
    ],
    name: "setKeeperAddresses",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "setMaxGlobalAmountPerPeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "setMaxInjectionAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "setMaxTotalDue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "period",
        type: "uint256",
      },
    ],
    name: "setMinWaitPeriodSeconds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "address",
        name: "dest",
        type: "address",
      },
    ],
    name: "sweep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
