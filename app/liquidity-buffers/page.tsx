"use client";

import { useQuery } from "@apollo/client";
import {
  GetBoostedPoolsDocument,
  GetBoostedPoolsQuery,
} from "@/lib/services/apollo/generated/graphql";
import {
  Box,
  Center,
  Icon,
  Text,
  VStack,
  SimpleGrid,
  Spinner,
  Heading,
  GridItem,
} from "@chakra-ui/react";
import { BiErrorCircle } from "react-icons/bi";
import { PoolCard } from "@/components/liquidityBuffers/PoolCard";
import { type Pool } from "@/types/interfaces";

export default function LiquidityBuffersPage() {
  const { loading, error, data } = useQuery<GetBoostedPoolsQuery>(GetBoostedPoolsDocument);

  const renderContent = () => {
    if (loading) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="whiteAlpha.50">
            <Spinner size="lg" color="gray.400" />
          </Box>
          <Text fontSize="m" color="gray.500">
            Loading pools...
          </Text>
        </Center>
      );
    }

    if (error || !data?.poolGetPools) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} rounded="full" bg="red.400" opacity={0.1}>
            <Icon as={BiErrorCircle} w={8} h={8} color="red.400" />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="lg" fontWeight="medium">
              Failed to load pools
            </Text>
            <Text fontSize="sm" color="gray.400">
              Please check your connection and try again
            </Text>
          </VStack>
        </Center>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {data.poolGetPools.map(pool => (
          <GridItem key={pool.address} rowSpan={pool.poolTokens.length + 1}>
            <PoolCard pool={pool as unknown as Pool} />
          </GridItem>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Box minH="100vh" bg="gray.950" color="gray.100" p={6}>
      <Box maxW="7xl" mx="auto">
        <Heading as="h2" size="lg" variant="special" mb={2}>
          Liquidity Buffers
        </Heading>
        <Text mb={8}>Liquidity buffer allocation visualization in Balancer v3 boosted pools.</Text>
        {renderContent()}
      </Box>
    </Box>
  );
}
