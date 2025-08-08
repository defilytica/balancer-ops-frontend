"use client";

import { Box, Container, Stack, Text, Link, Divider, useColorModeValue } from "@chakra-ui/react";

export default function Footer() {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Box bg={bgColor} mt="auto">
      <Divider />
      <Container maxW="container.xl" py={4}>
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          justify="space-between"
          align="center"
        >
          <Text fontSize="sm" color={textColor} textAlign={{ base: "center", md: "left" }}>
            <strong>Disclaimer:</strong> This is a self-custody application. You are solely
            responsible for all transactions. No liability is assumed by developers for any losses
            or errors. Use at your own risk.
          </Text>
          <Text fontSize="xs" color={textColor}>
            © 2025 DeFilytica
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
