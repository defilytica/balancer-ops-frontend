"use client";

import { ChakraProvider, ThemeTypings } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { theme as balTheme } from "./themes/bal/bal.theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  function getDefaultTheme() {
    return balTheme;
  }
  const defaultTheme = getDefaultTheme();

  function getTheme(): ThemeTypings {
    return defaultTheme;
  }

  return (
    <ChakraProvider
      theme={balTheme}
      cssVarsRoot="body"
      toastOptions={{ defaultOptions: { position: "bottom-left" } }}
    >
      {children}
    </ChakraProvider>
  );
}
