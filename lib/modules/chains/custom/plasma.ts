import { defineChain } from "viem";

export const plasma = defineChain({
  id: 9745,
  name: "Plasma",
  nativeCurrency: {
    decimals: 18,
    name: "XPL",
    symbol: "XPL",
  },
  rpcUrls: {
    default: {
      http: ["https://lb.drpc.org/ogrpc?network=plasma&dkey="],
      webSocket: ["wss://plasma.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "PlasmaScan",
      url: "https://plasmascan.to/",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1,
    },
  },
});
