"use client";

import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Link,
  HStack,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  VStack,
  Image,
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { type Pool, PoolToken } from "@/types/interfaces";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { BufferRow } from "./BufferRow";
import { networks } from "@/constants/constants";
import { getLendingProtocolFromTags } from "@/lib/utils/getLendingProtocolFromTags";
import { PoolWithBufferData } from "@/lib/hooks/useBufferData";

interface PoolCardProps {
  pool: PoolWithBufferData;
}

export const PoolCard = ({ pool }: PoolCardProps) => {
  const getBalancerNetworkPath = (chain: string): string => {
    return chain.toLowerCase() === "mainnet" ? "ethereum" : chain.toLowerCase();
  };

  return (
    <Card
      p={6}
      transition="all 0.2s"
      _hover={{
        bg: "whiteAlpha.50",
      }}
      height="fit-content"
      alignSelf="flex-start"
    >
      <CardHeader py={4} px={6}>
        <HStack justify="space-between" spacing={4}>
          <Box>
            <Heading size="md" mb={1}>
              <Link
                href={`https://balancer.fi/pools/${getBalancerNetworkPath(pool.chain)}/v3/${pool.address}`}
                isExternal
                _hover={{ color: "gray.300" }}
              >
                {pool.name}
              </Link>
            </Heading>
            <Text fontSize="sm">
              TVL: {shortCurrencyFormat(Number(pool.dynamicData.totalLiquidity))}
            </Text>
          </Box>
          <HStack spacing={3}>
            <Image
              src={networks[pool.chain.toLowerCase()].logo}
              alt={`${pool.chain} logo`}
              boxSize={6}
            />
            <Popover trigger="hover">
              <PopoverTrigger>
                <InfoOutlineIcon color="gray.400" boxSize={5} />
              </PopoverTrigger>
              <PopoverContent
                borderColor="whiteAlpha.200"
                p={4}
                minW="350px"
                _focus={{ outline: "none" }}
              >
                <VStack align="start" spacing={2}>
                  <Text fontWeight="semibold">Pool details</Text>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="gray.400">
                      Address:
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      {pool.address}
                    </Text>
                  </VStack>
                  {pool.tags.length > 0 && (
                    <Text fontSize="sm" color="gray.400">
                      Protocol: {getLendingProtocolFromTags(pool.tags)}
                    </Text>
                  )}
                </VStack>
              </PopoverContent>
            </Popover>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody p={6}>
        {pool.poolTokens.map((token: PoolToken, index: number) => (
          <BufferRow
            key={token.address}
            token={token}
            buffer={pool.buffers?.[token.address]}
            isLastToken={index === pool.poolTokens.length - 1}
          />
        ))}
      </CardBody>
    </Card>
  );
};
