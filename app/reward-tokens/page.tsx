"use client";

import React, { Suspense } from "react";
import { Box, Heading, Text, Spinner, VStack } from "@chakra-ui/react";
import RewardTokensOverview from "@/components/RewardTokensOverview";

function LoadingFallback() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Loading rewards data...</Text>
      </VStack>
    </Box>
  );
}

export default function RewardTokensPage() {
  return (
    <Box p={4} maxW="container.xl" mx="auto">
      <Heading as="h1" variant="special" size="xl" mb={2}>
        Reward Tokens Management
      </Heading>
      <Text mb={6}>Overview of pools, gauges, and their reward tokens</Text>
      <Suspense fallback={<LoadingFallback />}>
        <RewardTokensOverview />
      </Suspense>
    </Box>
  );
}
