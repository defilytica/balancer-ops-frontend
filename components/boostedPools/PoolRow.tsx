"use client";

import { calculateRatios } from "@/lib/utils/calculateRatios";
import { formatValue } from "@/lib/utils/formatValue";
import { PoolToken } from "@/types/interfaces";
import {
  Badge,
  Box,
  Center,
  Divider,
  HStack,
  Icon,
  Skeleton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { BiErrorCircle } from "react-icons/bi";
import {
  Bar,
  BarChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { formatUnits } from "viem";
import { BufferCardTooltip } from "./BufferCardTooltip";
import { isRealErc4626Token } from "@/lib/utils/tokenFilters";
import { BufferBlocklist } from "@/lib/services/fetchBufferBlocklist";

interface PoolRowProps {
  token: PoolToken;
  isLastToken: boolean;
  buffer?: {
    underlyingBalance: bigint;
    wrappedBalance: bigint;
    isInitialized: boolean;
    state: {
      isLoading: boolean;
      isError: boolean;
    };
  };
  blocklist?: BufferBlocklist;
}

export const PoolRow = ({ token, isLastToken, buffer, blocklist }: PoolRowProps) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  const { isLoading, isError } = buffer?.state || {};

  const formatBufferValue = (value: bigint, decimals: number) => {
    const formattedValue = Number(formatUnits(value, decimals));
    return value > 0 && formattedValue < 0.01 ? "< 0.01" : formatValue(value, decimals);
  };

  const isEmptyBuffer =
    buffer && buffer.underlyingBalance === BigInt(0) && buffer.wrappedBalance === BigInt(0);

  const ratios =
    buffer && calculateRatios(buffer.underlyingBalance, buffer.wrappedBalance, token.decimals!);

  const renderContent = () => {
    // Case1: Non-ERC4626 token
    if (!token.isErc4626) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              No buffer needed (non-ERC4626)
            </Text>
          </HStack>
        </Center>
      );
    }

    // Case 2: Fake ERC4626 / underlying token doesn't need a buffer
    if (!isRealErc4626Token(token, blocklist)) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              No buffer allocated / needed (fake ERC4626)
            </Text>
          </HStack>
        </Center>
      );
    }

    // Case 3: Loading state
    if (isLoading) {
      return (
        <Skeleton
          h="full"
          startColor="whiteAlpha.100"
          endColor="whiteAlpha.300"
          borderRadius="md"
        />
      );
    }

    // Case 4: Error state or no data
    if (isError || !buffer) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md" border="1px solid red.200">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              Failed to load buffer data
            </Text>
          </HStack>
        </Center>
      );
    }

    // Case 5: Buffer is not initialized
    if (!buffer?.isInitialized) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              The buffer has not been initialized!
            </Text>
          </HStack>
        </Center>
      );
    }

    // Case 6: Empty buffer
    if (isEmptyBuffer) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              Empty Buffer! Needs to be initialized!
            </Text>
          </HStack>
        </Center>
      );
    }

    const chartData = [
      {
        token,
        underlying: Number(formatUnits(buffer.underlyingBalance, token.decimals!)),
        wrapped: Number(formatUnits(buffer.wrappedBalance, token.decimals!)),
      },
    ];

    return (
      <Box h="full" display="flex" flexDir="column">
        <Box flex="1" minH="0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" stackOffset="expand" barSize={24}>
              <XAxis type="number" hide />
              <YAxis type="category" hide />
              <RechartsTooltip
                content={<BufferCardTooltip />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Bar dataKey="underlying" stackId="a" fill="#627EEA" radius={[4, 0, 0, 4]} />
              <Bar dataKey="wrapped" stackId="a" fill="#E5E5E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <HStack justify="space-between" mt={4} fontSize="sm">
          <HStack>
            <Box w="3" h="3" borderRadius="full" bg="#627EEA" />
            <Text color={textColor}>
              Underlying: {formatBufferValue(buffer.underlyingBalance, token.decimals!)}{" "}
              {token.underlyingToken?.symbol}
            </Text>
          </HStack>
          <HStack>
            <Box w="3" h="3" borderRadius="full" bg="#E5E5E5" />
            <Text color={textColor}>
              Wrapped: {formatBufferValue(buffer.wrappedBalance, token.decimals!)} {token.symbol}
            </Text>
          </HStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Box>
      <Box mb={4}>
        <HStack justify="space-between">
          <HStack spacing={2} maxW="70%">
            <Text fontWeight="medium" noOfLines={1}>
              {token.name}
            </Text>
            <Badge bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} textTransform="none">
              {token.symbol}
            </Badge>
          </HStack>
          {isRealErc4626Token(token, blocklist) && !isEmptyBuffer && ratios && (
            <Text fontSize="sm" color={textColor}>
              {ratios.underlying}% - {ratios.wrapped}%
            </Text>
          )}
        </HStack>
        <Box h="100px" mt={4}>
          {renderContent()}
        </Box>
      </Box>
      {!isLastToken && <Divider my={6} />}
    </Box>
  );
};
