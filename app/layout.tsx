"use client";
import { Providers } from './providers'
import { Box, Flex, useDisclosure } from '@chakra-ui/react'
import '@/public/css/global.css'
import { satoshiFont } from "@/public/fonts/satoshi/satoshi";
import {
    Drawer,
    DrawerContent,
} from '@chakra-ui/react'
import SidebarContent from "@/components/navigation/SidebarContent";
import MobileNav from "@/components/navigation/MobileNav";
import DesktopNav from "@/components/navigation/DesktopNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <html lang='en'>
        <body className={satoshiFont.className} suppressHydrationWarning>
        <Providers>
            <Box minH="100vh">
                <SidebarContent onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
                <Drawer
                    isOpen={isOpen}
                    placement="left"
                    onClose={onClose}
                    returnFocusOnClose={false}
                    onOverlayClick={onClose}
                    size="full">
                    <DrawerContent>
                        <SidebarContent onClose={onClose} />
                    </DrawerContent>
                </Drawer>
                <MobileNav onOpen={onOpen} />
                <DesktopNav />
                <Box ml={{ base: 0, md: 60 }} p="4">
                    <Flex flexDir="column" width="100%">
                        <main>{children}</main>
                    </Flex>
                </Box>
            </Box>
        </Providers>
        </body>
        </html>
    )
}