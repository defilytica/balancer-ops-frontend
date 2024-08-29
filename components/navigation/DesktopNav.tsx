import React from 'react'
import {
    Flex,
    useColorModeValue,
    Box, Avatar, Heading,
} from '@chakra-ui/react'
import DarkModeToggle from "@/components/btns/DarkModeToggle";
import { SignInButton } from "@/components/SignInButton";
import { useSession } from "next-auth/react";

const DesktopNav = () => {
    const session = useSession()

    return (
        <Flex
            ml={{ base: 0, md: 60 }}
            px={3}
            height="20"
            alignItems="center"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent="flex-end"
            display={{ base: 'none', md: 'flex' }}
        >
            <Flex alignItems="center" mr={4}>
                {session.data?.user?.image && (
                    <Avatar size="sm" src={session.data.user.image} mr={2} />
                )}
                <SignInButton />
            </Flex>
            <DarkModeToggle />
        </Flex>
    )
}

export default DesktopNav