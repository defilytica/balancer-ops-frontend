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
  fraxtal,
  gnosis,
  mainnet,
  mode,
  optimism,
  polygon,
  polygonZkEvm,
  sepolia,
  sonic,
} from "wagmi/chains";
import { hyperEvm } from "@/lib/modules/chains/custom/hyperevm";
import { plasma } from "@/lib/modules/chains/custom/plasma";
import { http } from "viem";
import MainnetLogo from "@/public/imgs/mainnet.svg";
import PolygonLogo from "@/public/imgs/polygon.svg";
import OptimismLogo from "@/public/imgs/optimism.svg";
import AvalancheLogo from "@/public/imgs/avalancheLogo.svg";
import ArbitrumLogo from "@/public/imgs/arbitrum.svg";
import GnosisLogo from "@/public/imgs/gnosis.svg";
import BaseLogo from "@/public/imgs/base.svg";
import zkevmLogo from "@/public/imgs/zkevm.svg";
import sepoliaLogo from "@/public/imgs/sepolia.svg";
import fraxtalLogo from "@/public/imgs/fraxtal.svg";
import sonicLogo from "@/public/imgs/sonic.svg";
import modeLogo from "@/public/imgs/mode.svg";
import hyperEVMILogo from "@/public/imgs/hyperevm.svg";
import plasmaLogo from "@/public/imgs/plasma.svg";
const appName = "Balancer Operations UI";
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "";

// Customize chain icons
const customChains = {
  mainnet: {
    ...mainnet,
    iconUrl: MainnetLogo.src,
  },
  arbitrum: {
    ...arbitrum,
    iconUrl: ArbitrumLogo.src,
  },
  base: {
    ...base,
    iconUrl: BaseLogo.src,
  },
  avalanche: {
    ...avalanche,
    iconUrl: AvalancheLogo.src,
  },
  gnosis: {
    ...gnosis,
    iconUrl: GnosisLogo.src,
  },
  optimism: {
    ...optimism,
    iconUrl: OptimismLogo.src,
  },
  polygon: {
    ...polygon,
    iconUrl: PolygonLogo.src,
  },
  polygonZkEvm: {
    ...polygonZkEvm,
    iconUrl: zkevmLogo.src,
  },
  sepolia: {
    ...sepolia,
    iconUrl: sepoliaLogo.src,
  },
  mode: {
    ...mode,
    iconUrl: modeLogo.src,
  },
  fraxtal: {
    ...fraxtal,
    iconUrl: fraxtalLogo.src,
  },
  sonic: {
    ...sonic,
    iconUrl: sonicLogo.src,
  },
  hyperevm: {
    ...hyperEvm,
    iconUrl: hyperEVMILogo.src,
  },
  plasma: {
    ...plasma,
    iconUrl: plasmaLogo.src,
  },
};

// Create connectors once at module level for stable references (important for Safe apps)
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

export type WagmiConfig = Config;

// Create config directly for stable references (important for Safe app compatibility)
export const wagmiConfig: Config = createConfig({
  chains: [
    customChains.mainnet,
    customChains.arbitrum,
    customChains.base,
    customChains.avalanche,
    customChains.gnosis,
    customChains.optimism,
    customChains.polygon,
    customChains.polygonZkEvm,
    customChains.sepolia,
    customChains.mode,
    customChains.fraxtal,
    customChains.sonic,
    customChains.hyperevm,
    customChains.plasma,
  ],
  transports: {
    [mainnet.id]: http("https://eth.drpc.org"),
    [arbitrum.id]: http("https://arbitrum.drpc.org"),
    [base.id]: http("https://base.drpc.org"),
    [avalanche.id]: http("https://avalanche.drpc.org"),
    [gnosis.id]: http("https://gnosis.drpc.org"),
    [optimism.id]: http("https://optimism.drpc.org"),
    [polygon.id]: http("https://polygon.llamarpc.com"),
    [polygonZkEvm.id]: http("https://polygon-zkevm.drpc.org"),
    [sepolia.id]: http("https://sepolia.gateway.tenderly.co"),
    [mode.id]: http("https://mode.drpc.org"),
    [fraxtal.id]: http("https://fraxtal.drpc.org"),
    [sonic.id]: http("https://sonic-rpc.publicnode.com"),
    [hyperEvm.id]: http("https://hyperliquid.drpc.org"),
    [plasma.id]: http("https://plasma.drpc.org"),
  },
  connectors,
  ssr: true,
});

// For compatibility - export the same config
export function getWagmiConfig(): Config {
  return wagmiConfig;
}
