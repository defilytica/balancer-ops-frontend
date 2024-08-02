// app/providers.tsx
'use client'
import {ThemeProvider} from "@/lib/shared/services/chakra/ThemeProvider";
import { ThemeProvider as ColorThemeProvider } from 'next-themes'
import {DEFAULT_THEME_COLOR_MODE} from "@/lib/shared/services/chakra/themes/base/foundations";
import {SessionProvider} from "next-auth/react";
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
