import {
    Box,
    Flex,
    Heading,
    Link,
} from '@chakra-ui/react';
import {BalancerLogo} from "@/public/imgs/BalancerLogo";
import DarkModeToggle from "@/components/btns/DarkModeToggle";




const Navbar = () => {

    return (
        <>
            <Box px={8}>
                <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                    <Link href={'/'}>
                    <Flex alignItems={'center'} justifyContent={'center'}>
                        <Box boxSize={30} marginRight={2}>
                            <BalancerLogo />
                        </Box>
                        <Box>
                            <Heading as="h5" size="md" variant="special">Ops Tooling</Heading>
                        </Box>
                    </Flex>
                    </Link>
                    <DarkModeToggle />
                </Flex>
            </Box>
        </>
    );
};

export default Navbar;

