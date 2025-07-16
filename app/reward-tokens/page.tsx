"use client";

import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import RewardTokensOverview from "@/components/RewardTokensOverview";

export default function RewardTokensPage() {
  return (
    <Box p={6} maxW="full">
      <Heading as="h1" size="xl" mb={2}>
        Reward Tokens Management
      </Heading>
      <Text mb={6} color="gray.600">
        Overview of pools, gauges, and their reward tokens
      </Text>
      <RewardTokensOverview />
    </Box>
  );
}