"use client";

import React from "react";
import {
  Box,
  Show,
  Card,
  Stack,
  HStack,
  Heading,
  Text,
  VStack,
  Divider,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { useFormattedPoolAttributes } from "@/lib/data/useFormattedPoolAttributes";
import { useFormattedHookAttributes } from "@/lib/data/useFormattedHookAttributes";
import { Pool } from "@/types/interfaces";
import { TbFishHook } from "react-icons/tb";

interface PoolInfoCardProps {
  pool: Pool;
  showHook?: boolean;
}

export const PoolInfoCard: React.FC<PoolInfoCardProps> = ({ pool, showHook = false }) => {
  const formattedAttributes = useFormattedPoolAttributes(pool);
  const formattedHookAttributes = showHook ? useFormattedHookAttributes(pool) : [];

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

        {showHook && !!pool.hook && (
          <>
            <Divider my={2} />
            <VStack width="full" alignItems="flex-start">
              <Flex width="full" justifyContent="space-between" alignItems="center">
                <Heading variant="h5" fontSize="1rem" mr={2}>
                  Hook Configuration
                </Heading>
                <Badge colorScheme="purple" display="flex" alignItems="center" px={2} py={1}>
                  <TbFishHook style={{ marginRight: "4px" }} />
                  {pool.hook?.type}
                </Badge>
              </Flex>
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

              {formattedHookAttributes.map(attribute => (
                <Stack
                  width="full"
                  spacing={{ base: "xxs", md: "xl" }}
                  key={`hook-attribute-${attribute.title}`}
                  direction={{ base: "column", md: "row" }}
                >
                  <Box minWidth="140px">
                    <Text fontSize="sm" variant={{ base: "primary", md: "secondary" }}>
                      {attribute.title}
                    </Text>
                  </Box>
                  <Text
                    variant={{ base: "secondary", md: "secondary" }}
                    mb={{ base: "sm", md: "0" }}
                  >
                    {attribute.value}
                  </Text>
                </Stack>
              ))}
            </VStack>
          </>
        )}
      </VStack>
    </Card>
  );
};
