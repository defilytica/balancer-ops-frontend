// app/providers.tsx
'use client'
import { ThemeProvider as ColorThemeProvider } from 'next-themes'
import {SessionProvider} from "next-auth/react";
import {DEFAULT_THEME_COLOR_MODE} from "@/lib/services/chakra/themes/base/foundations";
import {ThemeProvider} from "@/lib/services/chakra/ThemeProvider";
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
        <ColorThemeProvider defaultTheme={DEFAULT_THEME_COLOR_MODE}>
        <ThemeProvider>
                {children}
        </ThemeProvider>
        </ColorThemeProvider>
        </SessionProvider>
    )
}
