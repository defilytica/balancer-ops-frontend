import React from 'react'
import {
    Flex,
    useColorModeValue,
    Box,
} from '@chakra-ui/react'
import DarkModeToggle from "@/components/btns/DarkModeToggle";
import { SignInButton } from "@/components/SignInButton";

const DesktopNav = () => {
    return (
        <Flex
            ml={{ base: 0, md: 60 }}
            px={4}
            height="20"
            alignItems="center"
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent="flex-end"
            display={{ base: 'none', md: 'flex' }} // Show only on desktop
        >
            <Box mr={4}>
                <SignInButton />
            </Box>
            <DarkModeToggle />
        </Flex>
    )
}

export default DesktopNav
