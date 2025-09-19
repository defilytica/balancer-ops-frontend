"use client";

import { useQuery } from "@apollo/client";
import {
  GetV3PoolsDocument,
  GetV3PoolsQuery,
  GqlChain,
} from "@/lib/services/apollo/generated/graphql";
import {
  Box,
  Center,
  Icon,
  Text,
  VStack,
  Spinner,
  Heading,
  Flex,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { BiErrorCircle } from "react-icons/bi";
import { MdFilterListAlt } from "react-icons/md";
import { BoostedPoolsTable } from "@/components/tables/BoostedPoolsTable";
import { BoostedPoolsGrid } from "@/components/tables/BoostedPoolsGrid";
import { NetworkSelector } from "@/components/NetworkSelector";
import { ViewSwitcher, ViewMode } from "@/components/boostedPools/ViewSwitcher";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useState, useMemo } from "react";
import { AddressBook, Pool } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { useBufferData, PoolWithBufferData } from "@/lib/hooks/useBufferData";
import GlobeLogo from "@/public/imgs/globe.svg";
import { isRealErc4626Token } from "@/lib/utils/tokenFilters";

interface BoostedPoolsModuleProps {
  addressBook: AddressBook;
}

export default function BoostedPoolsModule({ addressBook }: BoostedPoolsModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("ALL");
  const [showOnlyEmptyBuffers, setShowOnlyEmptyBuffers] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TABLE);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    loading: loadingPools,
    error,
    data,
  } = useQuery<GetV3PoolsQuery>(GetV3PoolsDocument, {
    variables: {
      chainIn: selectedNetwork !== "ALL" ? [selectedNetwork] : undefined,
      chainNotIn: ["SEPOLIA" as GqlChain],
      tagIn: ["BOOSTED"],
    },
  });

  const allPools = (data?.poolGetPools || []) as unknown as Pool[];

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPools = allPools.slice(startIndex, endIndex);

  // Only fetch buffer data for paginated pools when filter is off
  // When empty buffers filter is on, we need all pools' buffer data
  const { pools: poolsWithBufferBalances, loading: loadingBuffers } = useBufferData(
    showOnlyEmptyBuffers ? allPools : paginatedPools,
  );

  const filteredPools = useMemo(() => {
    if (!showOnlyEmptyBuffers) return poolsWithBufferBalances;

    return poolsWithBufferBalances.filter((pool: PoolWithBufferData) => {
      // Show pool if a "real" ERC4626 token has empty buffer
      return pool.poolTokens.some(token => {
        if (!isRealErc4626Token(token)) return false;

        const buffer = pool.buffers?.[token.address];
        if (!buffer || buffer.state?.isError) return false;
        return buffer.underlyingBalance === BigInt(0) && buffer.wrappedBalance === BigInt(0);
      });
    });
  }, [poolsWithBufferBalances, showOnlyEmptyBuffers]);

  // When empty buffersfilter is on, we need to paginate the filtered results
  const displayedPools = useMemo(() => {
    if (!showOnlyEmptyBuffers) return filteredPools;
    return filteredPools.slice(startIndex, endIndex);
  }, [filteredPools, showOnlyEmptyBuffers, startIndex, endIndex]);

  const totalPages = useMemo(() => {
    if (showOnlyEmptyBuffers) {
      return Math.ceil(filteredPools.length / pageSize);
    }
    return Math.ceil(allPools.length / pageSize);
  }, [allPools.length, filteredPools.length, showOnlyEmptyBuffers, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const networkOptionsV3WithAll = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    const filteredNetworks = NETWORK_OPTIONS.filter(
      network => networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
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

  const networksWithAll = {
    ...networks,
    all: {
      logo: GlobeLogo.src,
      rpc: "",
      explorer: "",
      chainId: "",
    },
  };

  const handleFilterToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyEmptyBuffers(e.target.checked);
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
    setCurrentPage(1); // Reset to first page when changing network
  };

  const renderContent = () => {
    if (loadingPools) {
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

    // Special loading state for empty buffers filter as it needs to load all buffers for all pools
    if (showOnlyEmptyBuffers && loadingBuffers) {
      return (
        <Center h="50vh" flexDir="column" gap={4} w="full">
          <Box p={4} w="16" h="16" rounded="full" bg="whiteAlpha.50">
            <Spinner size="lg" color="gray.400" />
          </Box>
          <Text fontSize="m" color="gray.500">
            Looking for empty buffers...
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

    if (displayedPools.length === 0) {
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
      <VStack spacing={6} align="stretch">
        {viewMode === ViewMode.CARD ? (
          <BoostedPoolsGrid
            items={displayedPools}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            loadingLength={pageSize}
            loading={loadingBuffers}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        ) : (
          <BoostedPoolsTable
            pools={displayedPools}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loadingBuffers}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </VStack>
    );
  };

  return (
    <>
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        mb={2}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading as="h2" size="lg" variant="special" mb={2}>
            Boosted Pools
          </Heading>
          <Text>Boosted pools and their liquidity buffer allocations in Balancer v3.</Text>
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
              <Icon as={MdFilterListAlt} color={useColorModeValue("gray.600", "gray.200")} />
              <FormLabel mb="0" fontSize="md">
                Empty buffers only
              </FormLabel>
            </HStack>
            <Switch isChecked={showOnlyEmptyBuffers} onChange={handleFilterToggle} size="md" />
          </FormControl>
        </Flex>
      </Flex>

      <Flex justify="flex-start" mb={4}>
        <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
      </Flex>

      {renderContent()}
    </>
  );
}
