import React from 'react'
import {
    IconButton,
    Avatar,
    Box,
    Flex,
    HStack,
    VStack,
    useColorModeValue,
    Text,
    FlexProps,
    Heading,
} from '@chakra-ui/react'
import {
    FiMenu,
} from 'react-icons/fi'
import {BalancerLogo} from "@/public/imgs/BalancerLogo";
import DarkModeToggle from "@/components/btns/DarkModeToggle";
import {SignInButton} from "@/components/SignInButton";

interface MobileProps extends FlexProps {
    onOpen: () => void
}

const MobileNav = ({onOpen, ...rest}: MobileProps) => {
    return (
        <Flex
            ml={{base: 0, md: 60}}
            px={{base: 4, md: 4}}
            height="20"
            alignItems="center"

            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent={{base: 'space-between', md: 'flex-end'}}
            display={{base: 'flex', md: 'none'}}  // Hide on desktop
            {...rest}>
            <IconButton
                onClick={onOpen}
                variant="outline"
                aria-label="open menu"
                icon={<FiMenu/>}
            />

            <Flex alignItems="center">
                <Box boxSize={30} marginRight={2}>
                    <BalancerLogo/>
                </Box>
                <Box>
                    <Heading as="h5" size="md" variant="special">Ops Tooling</Heading>
                </Box>
            </Flex>

            <Box mr={2}>
                <SignInButton />
            </Box>
            <DarkModeToggle />
        </Flex>
    )
}

export default MobileNav