"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  Theme,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { theme, useTheme } from "@chakra-ui/react";
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
  const { colors, radii, shadows } = useTheme();
  const colorMode = useThemeColorMode();

  if (!isMounted) return null;

  const sharedConfig = {
    fonts: {
      body: theme.fonts?.body ?? "system-ui, sans-serif",
    },
    radii: {
      connectButton: radii.md,
      actionButton: radii.md,
      menuButton: radii.md,
      modal: radii.md,
      modalMobile: radii.md,
    },
    shadows: {
      connectButton: shadows.md,
      dialog: shadows.xl,
      profileDetailsAction: shadows.md,
      selectedOption: shadows.md,
      selectedWallet: shadows.md,
      walletLogo: shadows.md,
    },
    colors: {
      accentColor: colors.purple[500],
      modalBackground: colorMode === 'light'
          ? colors.light?.background?.level0 ?? '#FFFFFF'
          : colors.dark?.background?.level0 ?? '#363d45',
      modalText: colorMode === 'light'
          ? colors.light?.text?.primary ?? '#000000'
          : colors.dark?.text?.primary ?? '#FFFFFF',
    },
  };

  const _lightTheme = merge(lightTheme(), {
    ...sharedConfig,
  } as Theme);

  const _darkTheme = merge(darkTheme(), {
    ...sharedConfig,
  } as Theme);

  const customTheme = colorMode === 'dark' ? _darkTheme : _lightTheme;

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
