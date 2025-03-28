export const RootGaugeFactory = [
  {
    inputs: [
      {
        internalType: "contract IBalancerMinter",
        name: "minter",
        type: "address",
      },
      {
        internalType: "contract IPolygonRootChainManager",
        name: "polygonRootChainManager",
        type: "address",
      },
      { internalType: "address", name: "polygonERC20Predicate", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "gauge", type: "address" }],
    name: "GaugeCreated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      {
        internalType: "uint256",
        name: "relativeWeightCap",
        type: "uint256",
      },
    ],
    name: "create",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getGaugeImplementation",
    outputs: [{ internalType: "contract ILiquidityGauge", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "gauge", type: "address" }],
    name: "isGaugeFromFactory",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];
