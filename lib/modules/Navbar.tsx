
import {
    Box,
    Flex,
    Heading,
    Link,
} from '@chakra-ui/react';

import {BalancerLogo} from "@/lib/shared/imgs/BalancerLogo";
import DarkModeToggle from "@/lib/shared/components/btns/DarkModeToggle";

const Navbar = () => {

    return (
        <>
            <Box px={8}>
                <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                    <Link href={'/'}>
                    <Flex alignItems={'center'}>
                        <Box boxSize={30} marginRight={2}>
                            <BalancerLogo />{/* Placeholder for logo */}
                        </Box>
                        <Heading size="md" >Ops Tooling</Heading>
                    </Flex>
                    </Link>
                    <DarkModeToggle />
                </Flex>
            </Box>
        </>
    );
};

export default Navbar;

