"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { Config, createConfig } from "wagmi";
import {
  coinbaseWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";
import {
  arbitrum,
  avalanche,
  base,
  fantom,
  fraxtal,
  gnosis,
  mainnet,
  mode,
  optimism,
  polygon,
  polygonZkEvm,
  sepolia,
} from "wagmi/chains";
import { http } from "viem";

const appName = "Balancer Operations UI";
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        // metaMaskWallet must appear above injectedWallet to avoid random disconnection issues
        metaMaskWallet,
        safeWallet,
        walletConnectWallet,
        rabbyWallet,
        coinbaseWallet,
        rainbowWallet,
        injectedWallet,
      ],
    },
  ],
  { appName, projectId },
);

export type WagmiConfig = ReturnType<typeof createConfig>;
export const wagmiConfig: Config = createConfig({
  chains: [
    mainnet,
    arbitrum,
    base,
    avalanche,
    fantom,
    gnosis,
    optimism,
    polygon,
    polygonZkEvm,
    sepolia,
    mode,
    fraxtal,
  ],
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
    [arbitrum.id]: http("https://arbitrum.llamarpc.com"),
    [base.id]: http("https://base.llamarpc.com"),
    [avalanche.id]: http("https://avalanche.drpc.org"),
    [fantom.id]: http("https://1rpc.io/ftm"),
    [gnosis.id]: http("https://gnosis.drpc.org"),
    [optimism.id]: http("https://optimism.drpc.org"),
    [polygon.id]: http("https://polygon.llamarpc.com"),
    [polygonZkEvm.id]: http("https://polygon-zkevm.drpc.org"),
    [sepolia.id]: http("https://sepolia.gateway.tenderly.co"),
    [mode.id]: http("https://mode.drpc.org"),
    [fraxtal.id]: http("https://fraxtal.drpc.org"),
  },
  connectors,
  ssr: true,
});
