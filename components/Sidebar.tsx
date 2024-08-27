import React from 'react'
import {
    Box,
    CloseButton,
    Flex,
    useColorModeValue,
    Text,
    BoxProps,
} from '@chakra-ui/react'
import {
    FiHome,
    FiTrendingUp,
    FiCompass,
    FiStar,
    FiSettings,
} from 'react-icons/fi'
import { IconType } from 'react-icons'
import NavItem from "@/components/navigation/NavItem";


interface LinkItemProps {
    name: string
    icon: IconType
    target: string
}

const LinkItems: Array<LinkItemProps> = [
    { name: 'Home', icon: FiHome, target: '/' },
    { name: 'Trending', icon: FiTrendingUp, target: '/trending' },
    { name: 'Explore', icon: FiCompass, target: '/explore' },
    { name: 'Favourites', icon: FiStar, target: '/favourites' },
    { name: 'Settings', icon: FiSettings, target: '/settings' },
]

interface SidebarProps extends BoxProps {
    onClose: () => void
    isCollapsed: boolean
}

const SidebarContent = ({ onClose, isCollapsed, ...rest }: SidebarProps) => {
    return (
        <Box
            transition="3s ease"
            bg={useColorModeValue('white', 'gray.900')}
            borderRight="1px"
            borderRightColor={useColorModeValue('gray.200', 'gray.700')}
            w={{ base: 'full', md: isCollapsed ? 60 : 240 }}
            pos="fixed"
            h="full"
            {...rest}>
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
                    Logo
                </Text>
                <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
            </Flex>
            {LinkItems.map((link) => (
                <NavItem
                    key={link.name}
                    icon={link.icon}
                    target={link.target}
                    onClose={onClose}
                    isCollapsed={isCollapsed}
                >
                    {link.name}
                </NavItem>
            ))}
        </Box>
    )
}

export default SidebarContent