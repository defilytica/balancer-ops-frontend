import { Box, Heading, Text, Button, VStack, Container } from "@chakra-ui/react";

export default function Page() {
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
                    <Button
                        size="lg"
                        variant="secondary"
                        _hover={{ bg: "whiteAlpha.300" }}
                    >
                        Get Started
                    </Button>
                </VStack>
            </Container>
        </Box>
    )
}
