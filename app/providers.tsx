// app/providers.tsx
"use client";
import { ThemeProvider as ColorThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { DEFAULT_THEME_COLOR_MODE } from "@/lib/services/chakra/themes/base/foundations";
import { ThemeProvider } from "@/lib/services/chakra/ThemeProvider";
import { ChakraProvider } from "@chakra-ui/react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ApolloClientProvider } from "@/lib/services/apollo/ApolloClientprovider";
import { Web3Provider } from "@/lib/modules/web3/Web3Provider";
import { wagmiConfig } from "@/lib/modules/web3/WagmiConfig";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApolloClientProvider>
        <Web3Provider wagmiConfig={wagmiConfig}>
          <CacheProvider>
            <ChakraProvider>
              <ColorThemeProvider defaultTheme={DEFAULT_THEME_COLOR_MODE}>
                <ThemeProvider>{children}</ThemeProvider>
              </ColorThemeProvider>
            </ChakraProvider>
          </CacheProvider>
        </Web3Provider>
      </ApolloClientProvider>
    </SessionProvider>
  );
}
