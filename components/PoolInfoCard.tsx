"use client";

import React from "react";
import { Box, Show, Card, Stack, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { useFormattedPoolAttributes } from "@/lib/data/useFormattedPoolAttributes";
import { Pool } from "@/types/interfaces";

interface PoolInfoCardProps {
  pool: Pool;
}

export const PoolInfoCard: React.FC<PoolInfoCardProps> = ({ pool }) => {
  const formattedAttributes = useFormattedPoolAttributes(pool);

  return (
    <Card>
      <VStack alignItems="flex-start" spacing={{ base: "sm", md: "md" }} width="full" p={4}>
        <Heading variant="h4" fontSize="1.25rem">
          {pool.name}
        </Heading>
        <VStack width="full">
          <Show above="md">
            <HStack spacing={{ base: "0", md: "xl" }} width="full">
              <Box minWidth="140px">
                <Heading variant="h6" fontSize="1rem">
                  Attribute
                </Heading>
              </Box>
              <Heading variant="h6" fontSize="1rem">
                Details
              </Heading>
            </HStack>
          </Show>
          {formattedAttributes.map(attribute => (
            <Stack
              width="full"
              spacing={{ base: "xxs", md: "xl" }}
              key={`pool-attribute-${attribute.title}`}
              direction={{ base: "column", md: "row" }}
            >
              <Box minWidth="140px">
                <Text fontSize="sm" variant={{ base: "primary", md: "secondary" }}>
                  {attribute.title}
                </Text>
              </Box>
              <Text variant={{ base: "secondary", md: "secondary" }} mb={{ base: "sm", md: "0" }}>
                {attribute.value}
              </Text>
            </Stack>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
};
