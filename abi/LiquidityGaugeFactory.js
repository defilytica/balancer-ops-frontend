export const LiquidityGaugeFactory = [
  {
    inputs: [
      {
        internalType: "contract IStakingLiquidityGauge",
        name: "gauge",
        type: "address",
      },
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
      { internalType: "address", name: "pool", type: "address" },
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
