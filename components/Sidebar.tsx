'use client'
import React, {useEffect, useState} from 'react'
import {
    Flex,
    IconButton,
    Divider,
    Avatar,
    Heading
} from '@chakra-ui/react'
import {
    FiMenu,
    FiHome,
} from 'react-icons/fi'
import { SiChainlink } from "react-icons/si";
import { RiContractLine } from "react-icons/ri";
import { TbTransactionBitcoin } from "react-icons/tb";
import NavItem from './NavItem'
import {useSession} from "next-auth/react";
import {SignInButton} from "@/components/SignInButton";

export default function Sidebar() {
    const session = useSession()
    const [navSize, setNavSize] = useState<"small" | "large">("small")
    const [showText, setShowText] = useState(navSize === "large");

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (navSize === "large") {
            timeout = setTimeout(() => setShowText(true), 0.3 * 1000);
        } else {
            setShowText(false);
        }
        return () => clearTimeout(timeout);
    }, [navSize]);

    return (
        <Flex
            pos="sticky"
            left="5"
            mb={2}
            h="85vh"
            boxShadow="0 4px 12px 0 rgba(0, 0, 0, 0.1)"
            borderRadius={navSize == "small" ? "15px" : "30px"}
            w={navSize == "small" ? "75px" : "300px"}
            flexDir="column"
            justifyContent="space-between"
            transition="all 0.3s ease"
        >
            <Flex
                p="5%"
                flexDir="column"
                w="100%"
                alignItems={navSize == "small" ? "center" : "flex-start"}
                as="nav"
            >
                <IconButton
                    mt={5}
                    _hover={{ background: 'none' }}
                    icon={<FiMenu />}
                    onClick={() => {
                        if (navSize == "small")
                            setNavSize("large")
                        else
                            setNavSize("small")
                    }}
                    aria-label="Menu"
                />
                <NavItem navSize={navSize} icon={FiHome} title="Home" target={'/'} description="Navigate back to Home" />
                <NavItem navSize={navSize} icon={TbTransactionBitcoin} title="Payload Builder" target={'/payload-builder'} description="Choose from a variety of options to create Balancer DAO Payloads" />
                <NavItem navSize={navSize} icon={RiContractLine} title="Rewards Injector" target={'/rewards-injector'} description="View and Configure Gauge Rewards injectors" />
                <NavItem navSize={navSize} icon={SiChainlink} title="Automation Catalog" target={'/chainlink-automation'} description="View Chainlink Automation Upkeeps" />
            </Flex>
            <Flex
                p="5%"
                flexDir="column"
                w="100%"
                alignItems={navSize == "small" ? "center" : "flex-start"}
                mb={4}
            >
                <Divider display={navSize == "small" ? "none" : "flex"} />
                {session.data?.user?.image && (
                    <Flex
                        mt={4}
                        flexDirection="column"
                        align={navSize == "small" ? "center" : "flex-start"}
                        transition="all 0.3s ease"
                    >
                        <Flex align="center">
                            <Avatar size="sm" src={session?.data.user.image} />
                            <Flex
                                flexDir="column"
                                ml={4}
                                display={navSize == "small" ? "none" : "flex"}
                            >
                                <Heading
                                    as="h3"
                                    size="sm"
                                    opacity={showText ? 1 : 0}
                                >
                                    {session.data.user.name}
                                </Heading>
                            </Flex>
                        </Flex>
                    </Flex>
                )}
                <Flex
                    mt={2}
                    justifyContent={navSize == "small" ? "center" : "flex-start"}
                    width="100%"
                >
                    <SignInButton/>
                </Flex>
            </Flex>
        </Flex>
    )
}
