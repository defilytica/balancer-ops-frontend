import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'
import Navbar from "@/lib/modules/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "%s - Balancer Ops Tooling",
    description: "",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode,
}) {
    return (
        <html lang='en'>
        <body className={inter.className}>
        <Providers>
            <Navbar />
            {children}
        </Providers>
        </body>
        </html>
    )
}