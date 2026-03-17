"use client";

import { Box, Button, Heading, Text, VStack, useColorModeValue } from "@chakra-ui/react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const textColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Box ml={{ base: 0, md: 72 }} p="4">
      <VStack spacing={4} py={16} textAlign="center">
        <Heading size="lg">Something went wrong</Heading>
        <Text color={textColor} maxW="md">
          An unexpected error occurred. You can try again or navigate to a different page.
        </Text>
        <Button colorScheme="blue" onClick={reset}>
          Try again
        </Button>
      </VStack>
    </Box>
  );
}
