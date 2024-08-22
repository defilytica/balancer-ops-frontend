import React from 'react'
import {
    Box,
    CloseButton,
    Flex,
    useColorModeValue,
    Heading,
    BoxProps,
    HStack,
} from '@chakra-ui/react'
import {
    FiHome,
} from 'react-icons/fi'
import { SiChainlink } from "react-icons/si";
import { RiContractLine } from "react-icons/ri";
import { TbTransactionBitcoin } from "react-icons/tb";
import NavItem from './NavItem'
import { BalancerLogo } from "@/public/imgs/BalancerLogo";
import { SignInButton } from "@/components/SignInButton";
import DarkModeToggle from "@/components/btns/DarkModeToggle";

interface SidebarProps extends BoxProps {
    onClose: () => void
}

const LinkItems = [
    { name: 'Home', icon: FiHome, target: '/', description: "Navigate back to Home" },
    { name: 'Payload Builder', icon: TbTransactionBitcoin, target: '/payload-builder', description: "Choose from a variety of options to create Balancer DAO Payloads" },
    { name: 'Rewards Injector', icon: RiContractLine, target: '/rewards-injector', description: "View and Configure Gauge Rewards injectors" },
    { name: 'Automation Catalog', icon: SiChainlink, target: '/chainlink-automation', description: "View Chainlink Automation Upkeeps" },
];

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
    return (
        <Box
            bg={useColorModeValue('#EFEDE6', '#393E48')}
            borderRight="2px"
            borderRightColor={useColorModeValue('gray.200', 'gray.700')}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            {...rest}>
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                <Flex alignItems="center">
                    <Box boxSize={30} marginRight={2}>
                        <BalancerLogo />
                    </Box>
                    <Box>
                        <Heading as="h5" size="md" variant="special">Ops Tooling</Heading>
                    </Box>
                </Flex>
                <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
            </Flex>
            {LinkItems.map((link) => (
                <NavItem key={link.name} icon={link.icon} target={link.target} onClose={onClose}>
                    {link.name}
                </NavItem>
            ))}
            <Flex
                position="absolute"
                bottom="5"
                width="100%"
                justifyContent="center"
                flexDirection="column"
                alignItems="center"
            >
            </Flex>
        </Box>
    )
}

export default SidebarContent