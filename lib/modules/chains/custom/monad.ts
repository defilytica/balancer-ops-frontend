import { defineChain } from "viem";

export const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://lb.drpc.live/monad-mainnet/"],
      webSocket: ["wss://monad-mainnet.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadScan",
      url: "https://monadscan.com/",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1,
    },
  },
});
