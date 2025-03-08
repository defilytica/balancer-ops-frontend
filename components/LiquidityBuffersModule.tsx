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
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Divider,
} from "@chakra-ui/react";
import { BiErrorCircle } from "react-icons/bi";
import { MdFilterListAlt } from "react-icons/md";
import { PoolCard } from "@/components/liquidityBuffers/PoolCard";
import { NetworkSelector } from "@/components/NetworkSelector";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useState, useMemo } from "react";
import { AddressBook, Pool } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { useBufferBalances, PoolWithBufferBalances } from "@/lib/hooks/useBufferBalances";
import GlobeLogo from "@/public/imgs/globe.svg";

interface LiquidityBuffersModuleProps {
  addressBook: AddressBook;
}

export default function LiquidityBuffersModule({ addressBook }: LiquidityBuffersModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("ALL");
  const [showOnlyEmptyBuffers, setShowOnlyEmptyBuffers] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const { loading, error, data } = useQuery<GetBoostedPoolsQuery>(GetBoostedPoolsDocument, {
    variables: selectedNetwork !== "ALL" ? { chainIn: [selectedNetwork] } : {},
    context: {
      uri:
        selectedNetwork === "SEPOLIA"
          ? "https://test-api-v3.balancer.fi/"
          : "https://api-v3.balancer.fi/",
    },
  });

  const poolsWithBalances = useBufferBalances((data?.poolGetPools || []) as unknown as Pool[]);

  const filteredPools = useMemo(() => {
    if (!showOnlyEmptyBuffers) return poolsWithBalances;

    return poolsWithBalances.filter((pool: PoolWithBufferBalances) => {
      // Show pool if any ERC4626 token has empty buffer
      return pool.poolTokens.some(token => {
        if (!token.isErc4626) return false;
        const buffer = pool.buffers?.[token.address];
        if (!buffer) return false;
        return buffer.underlyingBalance === BigInt(0) && buffer.wrappedBalance === BigInt(0);
      });
    });
  }, [poolsWithBalances, showOnlyEmptyBuffers]);

  const networkOptionsV3WithAll = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    const filteredNetworks = NETWORK_OPTIONS.filter(network =>
      networksWithV3.includes(network.apiID.toLowerCase()),
    );

    return [
      {
        label: "All networks",
        apiID: "ALL",
        chainId: "",
      },
      ...filteredNetworks,
    ];
  }, [addressBook]);

  const networksWithAll = useMemo(
    () => ({
      ...networks,
      all: {
        logo: GlobeLogo.src,
        rpc: "",
        explorer: "",
        chainId: "",
      },
    }),
    [],
  );

  const handleFilterToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFiltering(true);
    setShowOnlyEmptyBuffers(e.target.checked);
    setTimeout(() => setIsFiltering(false), 250);
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
  };

  const renderContent = () => {
    if (loading || isFiltering) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="whiteAlpha.50">
            <Spinner size="lg" color="gray.400" />
          </Box>
          <Text fontSize="m" color="gray.500">
            {isFiltering ? "Filtering pools..." : "Loading pools..."}
          </Text>
        </Center>
      );
    }

    if (error || !data?.poolGetPools) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="red.400" opacity={0.2}>
            <Icon as={BiErrorCircle} w={8} h={8} color="red.700" />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="lg" fontWeight="medium">
              Failed to load pools
            </Text>
            <Text fontSize="m" color="gray.400">
              Please check your connection and try again
            </Text>
          </VStack>
        </Center>
      );
    }

    if (filteredPools.length === 0) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="gray.400" opacity={0.2}>
            <Icon as={BiErrorCircle} w={8} h={8} color="gray.700" />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="lg" fontWeight="medium">
              No pools found
            </Text>
            <Text fontSize="m" color="gray.400">
              Try adjusting your filters
            </Text>
          </VStack>
        </Center>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {filteredPools.map(pool => (
          <GridItem key={pool.address} rowSpan={pool.poolTokens.length + 1}>
            <PoolCard pool={pool} />
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

        <Flex direction="column" p={2} gap={2} borderRadius="xl" borderWidth="1px" minW="250px">
          <NetworkSelector
            networks={networksWithAll}
            networkOptions={networkOptionsV3WithAll}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
          />
          <Divider />
          <FormControl display="flex" alignItems="center" justifyContent="space-between" px={1}>
            <HStack spacing={2}>
              <Icon as={MdFilterListAlt} />
              <FormLabel mb="0" fontSize="md">
                Empty buffers only
              </FormLabel>
            </HStack>
            <Switch isChecked={showOnlyEmptyBuffers} onChange={handleFilterToggle} size="md" />
          </FormControl>
        </Flex>
      </Flex>

      {renderContent()}
    </>
  );
}
