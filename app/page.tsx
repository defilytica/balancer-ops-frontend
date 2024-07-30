'use client'
import { useState } from "react";
import { Box, Heading, Text, Button, VStack, Container, Grid, GridItem, Link } from "@chakra-ui/react";
import {SignInButton} from "@/lib/modules/components/SignInButton";

export default function Page() {
    const [showOptions, setShowOptions] = useState(false);

    const options = [
        { title: "Create DAO Payloads", href: "/payload-builder" },
        { title: "Injector Viewer", href: "/rewards-injector" }
    ];

    return (
        <Box
            minHeight="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Container maxW="container.xl">
                <VStack spacing={8} textAlign="center">
                    <Heading
                        as="h1"
                        p={3}
                        size="4xl"
                        variant="special"
                        fontWeight="bold"
                    >
                        Welcome to Balancer Ops Tooling
                    </Heading>
                    <Text fontSize="xl" variant="secondary">
                        Streamlining Balancer DAO operations with our powerful suite of tools
                    </Text>
                    {!showOptions ? (
                        <Button
                            size="lg"
                            variant="secondary"
                            _hover={{ bg: "whiteAlpha.300" }}
                            onClick={() => setShowOptions(true)}
                        >
                            Get Started
                        </Button>
                    ) : (
                        <Grid templateColumns="repeat(2, 1fr)" gap={6} mt={8}>
                            {options.map((option, index) => (
                                <GridItem key={index}>
                                    <Link href={option.href} _hover={{ textDecoration: 'none' }}>
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            width="100%"
                                        >
                                            {option.title}
                                        </Button>
                                    </Link>
                                </GridItem>
                            ))}
                        </Grid>
                    )}
                </VStack>
            </Container>
        </Box>
    )
}
