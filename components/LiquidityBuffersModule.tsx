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
  Flex,
} from "@chakra-ui/react";
import { BiErrorCircle } from "react-icons/bi";
import { PoolCard } from "@/components/liquidityBuffers/PoolCard";
import { type Pool } from "@/types/interfaces";
import { NetworkSelector } from "@/components/NetworkSelector";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useMemo, useState } from "react";
import { AddressBook } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";

interface LiquidityBuffersModuleProps {
  addressBook: AddressBook;
}

export default function LiquidityBuffersModule({ addressBook }: LiquidityBuffersModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("ALL");

  const { loading, error, data } = useQuery<GetBoostedPoolsQuery>(GetBoostedPoolsDocument, {
    variables: selectedNetwork !== "ALL" ? { chainIn: [selectedNetwork] } : {},
    context: {
      uri:
        selectedNetwork === "SEPOLIA"
          ? "https://test-api-v3.balancer.fi/"
          : "https://api-v3.balancer.fi/",
    },
  });

  const networkOptionsWithAll = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    const filteredNetworks = NETWORK_OPTIONS.filter(network =>
      networksWithV3.includes(network.apiID.toLowerCase()),
    );

    return [{ label: "All networks", apiID: "ALL", chainId: "0" }, ...filteredNetworks];
  }, [addressBook]);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
  };

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
    <>
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        mb={8}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading as="h2" size="lg" variant="special" mb={2}>
            Liquidity Buffers
          </Heading>
          <Text>Liquidity buffer allocation visualization in Balancer v3 boosted pools.</Text>
        </Box>

        <Box p={2} minW={{ base: "full", md: "250px" }} maxW={{ base: "full", md: "300px" }}>
          <NetworkSelector
            networks={networks}
            networkOptions={networkOptionsWithAll}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
          />
        </Box>
      </Flex>

      {renderContent()}
    </>
  );
}
