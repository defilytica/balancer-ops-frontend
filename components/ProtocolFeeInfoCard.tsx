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
  Badge,
  Flex,
  Spinner,
} from "@chakra-ui/react";

interface ProtocolFeeInfo {
  swapFeePercentage: number | null;
  swapFeeIsOverride: boolean;
  yieldFeePercentage: number | null;
  yieldFeeIsOverride: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ProtocolFeeInfoCardProps {
  feeInfo: ProtocolFeeInfo;
}

export const ProtocolFeeInfoCard: React.FC<ProtocolFeeInfoCardProps> = ({ feeInfo }) => {
  if (feeInfo.isLoading) {
    return (
      <Card>
        <VStack alignItems="center" spacing={4} width="full" p={4}>
          <Spinner size="md" />
          <Text>Loading protocol fees...</Text>
        </VStack>
      </Card>
    );
  }

  if (feeInfo.error) {
    return (
      <Card>
        <VStack alignItems="flex-start" spacing={4} width="full" p={4}>
          <Heading variant="h4" fontSize="1.25rem">
            Protocol Fees
          </Heading>
          <Text color="red.400">{feeInfo.error}</Text>
        </VStack>
      </Card>
    );
  }

  const protocolFeeAttributes = [
    {
      title: "Protocol Swap Fee",
      value:
        feeInfo.swapFeePercentage !== null
          ? `${feeInfo.swapFeePercentage.toFixed(4)}%`
          : "N/A",
      isOverride: feeInfo.swapFeeIsOverride,
    },
    {
      title: "Protocol Yield Fee",
      value:
        feeInfo.yieldFeePercentage !== null
          ? `${feeInfo.yieldFeePercentage.toFixed(4)}%`
          : "N/A",
      isOverride: feeInfo.yieldFeeIsOverride,
    },
  ];

  return (
    <Card>
      <VStack alignItems="flex-start" spacing={{ base: "sm", md: "md" }} width="full" p={4}>
        <Flex width="full" justifyContent="space-between" alignItems="center">
          <Heading variant="h4" fontSize="1.25rem">
            Protocol Fees
          </Heading>
        </Flex>

        <VStack width="full">
          <Show above="md">
            <HStack spacing={{ base: "0", md: "xl" }} width="full">
              <Box minWidth="160px">
                <Heading variant="h6" fontSize="1rem">
                  Fee Type
                </Heading>
              </Box>
              <Heading variant="h6" fontSize="1rem">
                Current Value
              </Heading>
            </HStack>
          </Show>

          {protocolFeeAttributes.map(attribute => (
            <Stack
              width="full"
              spacing={{ base: "xxs", md: "xl" }}
              key={`protocol-fee-${attribute.title}`}
              direction={{ base: "column", md: "row" }}
            >
              <Box minWidth="160px">
                <Text fontSize="sm" variant={{ base: "primary", md: "secondary" }}>
                  {attribute.title}
                </Text>
              </Box>
              <Flex alignItems="center" gap={2}>
                <Text
                  variant={{ base: "secondary", md: "secondary" }}
                  mb={{ base: "sm", md: "0" }}
                >
                  {attribute.value}
                </Text>
                {attribute.isOverride && (
                  <Badge colorScheme="blue" fontSize="xs">
                    Pool Override
                  </Badge>
                )}
              </Flex>
            </Stack>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
};
