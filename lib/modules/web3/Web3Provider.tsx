"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  Theme,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { useTheme } from "@chakra-ui/react";
import { merge } from "lodash";
import { PropsWithChildren } from "react";
import { WagmiConfig } from "./WagmiConfig";
import { CustomAvatar } from "./CustomAvatar";
import { useIsMounted } from "@/lib/shared/hooks/useIsMounted";
import { useThemeColorMode } from "@/lib/services/chakra/useThemeColorMode";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Web3Provider({
                               children,
                               wagmiConfig,
                             }: PropsWithChildren<{ wagmiConfig: WagmiConfig }>) {
  const isMounted = useIsMounted();
  const theme = useTheme();
  const colorMode = useThemeColorMode();
  const colorModeKey = colorMode === "light" ? "default" : "_dark";

  if (!isMounted) return null;

  // Safe access to theme properties with defaults
  const sharedConfig = {
    fonts: {
      body: theme.fonts?.body ?? "system-ui, sans-serif",
    },
    radii: {
      connectButton: theme.radii?.md ?? "0.375rem",
      actionButton: theme.radii?.md ?? "0.375rem",
      menuButton: theme.radii?.md ?? "0.375rem",
      modal: theme.radii?.md ?? "0.375rem",
      modalMobile: theme.radii?.md ?? "0.375rem",
    },
    shadows: {
      connectButton: theme.shadows?.md ?? "none",
      dialog: theme.shadows?.xl ?? "none",
      profileDetailsAction: theme.shadows?.md ?? "none",
      selectedOption: theme.shadows?.md ?? "none",
      selectedWallet: theme.shadows?.md ?? "none",
      walletLogo: theme.shadows?.md ?? "none",
    },
    colors: {
      accentColor: theme.colors?.purple?.[500] ?? "#7C3AED",
      modalBackground: theme.semanticTokens?.colors?.background?.level0?.[colorModeKey] ??
          (colorMode === "dark" ? "#1A1B1F" : "#FFFFFF"),
      modalText: theme.semanticTokens?.colors?.font?.primary?.[colorModeKey] ??
          (colorMode === "dark" ? "#FFFFFF" : "#000000"),
    },
  };

  const customTheme = merge(
      colorMode === "dark" ? darkTheme() : lightTheme(),
      sharedConfig as Theme,
  );

  return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider avatar={CustomAvatar} theme={customTheme}>
            {children}
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
  );
}
