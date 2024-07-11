import NextLink from 'next/link'
import {
    Box,
    Flex,
    Heading,
    IconButton,
    useColorMode,
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    VStack,
    Link
} from '@chakra-ui/react';
import { SunIcon, MoonIcon, HamburgerIcon } from '@chakra-ui/icons';
import {BalancerLogo} from "@/app/lib/shared/imgs/BalancerLogo";

const Navbar = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Box px={4}>
                <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                    <Flex alignItems={'center'}>
                        <IconButton
                            size="md"
                            icon={<HamburgerIcon />}
                            aria-label="Open Menu"
                            onClick={onOpen}
                            mr={4}
                        />
                        <Box boxSize={30} marginRight={2}>
                            <BalancerLogo />{/* Placeholder for logo */}
                        </Box>
                        <Heading size="md" color="white">Ops Tooling</Heading>
                    </Flex>
                    <IconButton
                        size="md"
                        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                        aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
                        onClick={toggleColorMode}
                    />
                </Flex>
            </Box>

            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Menu</DrawerHeader>

                    <DrawerBody>
                        <VStack spacing={4}>
                            <Link href="/">Home</Link>
                            <Link as={NextLink} href="/payloadBuilder">Payload Builder</Link>
                            <Link href="/rewardsInjector">Rewards Injector</Link>
                        </VStack>
                    </DrawerBody>

                    <DrawerFooter>
                        <Button variant="outline" mr={3} onClick={onClose}>
                            Close
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default Navbar;

