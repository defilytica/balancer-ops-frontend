import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from './providers'
import Navbar from "@/components/Navbar";
import { Flex } from '@chakra-ui/react'
import Sidebar from "@/components/Sidebar";
import '@/public/css/global.css'
import {satoshiFont} from "@/public/fonts/satoshi/satoshi";

export const metadata: Metadata = {
    title: "Balancer Ops Tooling",
    description: "Tooling Suite for Balancer DAOs On-Chain Operations",
};

export default function RootLayout({children,}: { children: React.ReactNode }) {
    return (
        <html lang='en'>
        <body className={satoshiFont.className} suppressHydrationWarning>
        <Providers>
            <Navbar/>
            <Flex>
                <Sidebar/>
                <Flex flexDir="column" width="100%">
                    <main>{children}</main>
                </Flex>
            </Flex>
        </Providers>
        </body>
        </html>
    )
}
