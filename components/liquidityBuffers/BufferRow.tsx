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
import { useQuery } from "@tanstack/react-query";
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
import { BufferTooltip } from "./BufferTooltip";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";
import { networks } from "@/constants/constants";

interface BufferRowProps {
  token: PoolToken;
  isLastToken: boolean;
}

export const BufferRow = ({ token, isLastToken }: BufferRowProps) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  let network = token.chain!.toLowerCase();

  const {
    data: bufferBalance,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bufferBalance", token.address, network],
    queryFn: () => fetchBufferBalance(token.address, network),
    enabled: token.isErc4626 && !!networks[network],
  });

  const balance = bufferBalance && {
    underlyingBalance: bufferBalance.underlyingBalance,
    wrappedBalance: bufferBalance.wrappedBalance,
  };

  const isEmptyBuffer =
    balance && balance.underlyingBalance === BigInt(0) && balance.wrappedBalance === BigInt(0);

  const ratios =
    balance && calculateRatios(balance.underlyingBalance, balance.wrappedBalance, token.decimals!);

  const renderContent = () => {
    if (!token.isErc4626) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              No buffer allocated
            </Text>
          </HStack>
        </Center>
      );
    }

    // Case 2: Loading state
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

    // Case 3: Error state or no data
    if (isError || !bufferBalance || !balance) {
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

    // Case 4: Empty buffer
    if (isEmptyBuffer) {
      return (
        <Center h="full" bg="whiteAlpha.50" rounded="md">
          <HStack>
            <Icon as={BiErrorCircle} boxSize={4} />
            <Text fontSize="sm" color={textColor}>
              No buffer allocated
            </Text>
          </HStack>
        </Center>
      );
    }

    const chartData = [
      {
        token,
        underlying: Number(formatUnits(balance.underlyingBalance, token.decimals!)),
        wrapped: Number(formatUnits(balance.wrappedBalance, token.decimals!)),
      },
    ];

    return (
      <Box h="full" display="flex" flexDir="column">
        <Box flex="1" minH="0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" stackOffset="expand" barSize={24}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <RechartsTooltip
                content={<BufferTooltip />}
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
              Underlying: {formatValue(balance.underlyingBalance, token.decimals!)}{" "}
              {token.underlyingToken?.symbol}
            </Text>
          </HStack>
          <HStack>
            <Box w="3" h="3" borderRadius="full" bg="#E5E5E5" />
            <Text color={textColor}>
              Wrapped: {formatValue(balance.wrappedBalance, token.decimals!)} {token.symbol}
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
          {token.isErc4626 && !isEmptyBuffer && ratios && (
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
