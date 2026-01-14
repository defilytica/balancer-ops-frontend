"use client";

import { useQuery } from "@apollo/client";
import {
  GetTokensDocument,
  GetTokensQuery,
  GetTokensQueryVariables,
  GqlChain,
  GqlTokenType,
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
  Container,
} from "@chakra-ui/react";
import { BiErrorCircle } from "react-icons/bi";
import { LiquidityBuffersTable } from "@/components/tables/LiquidityBuffersTable";
import { LiquidityBuffersFilters } from "@/components/LiquidityBuffersFilters";
import { SearchInput } from "@/lib/shared/components/SearchInput";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useState, useMemo } from "react";
import { AddressBook, TokenListToken } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { BufferBlocklist } from "@/lib/services/fetchBufferBlocklist";
import { useTokenBufferData } from "@/lib/hooks/useTokenBufferData";

interface LiquidityBuffersModuleProps {
  addressBook: AddressBook;
  bufferBlocklist: BufferBlocklist;
}

export default function LiquidityBuffersModule({
  addressBook,
  bufferBlocklist,
}: LiquidityBuffersModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("MAINNET");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { loading, error, data } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
    GetTokensDocument,
    {
      variables: {
        chainIn: [selectedNetwork as GqlChain],
        typeIn: [GqlTokenType.Erc4626],
      },
      skip: !selectedNetwork,
      context: {
        uri:
          selectedNetwork === "SEPOLIA"
            ? "https://test-api-v3.balancer.fi/"
            : "https://api-v3.balancer.fi/",
      },
    },
  );

  const allTokens = (data?.tokenGetTokens || []) as unknown as TokenListToken[];

  const { tokensWithBufferData, isBufferDataLoading } = useTokenBufferData(allTokens);

  const filteredTokens = useMemo(() => {
    let filtered = tokensWithBufferData;

    // Filter out blocklisted tokens
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const chainId = networkOption?.chainId;
    if (chainId && bufferBlocklist[chainId]) {
      const blockedAddresses = bufferBlocklist[chainId];
      filtered = filtered.filter(token => !blockedAddresses.includes(token.address?.toLowerCase() ?? ""));
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        token =>
          token.name?.toLowerCase().includes(searchLower) ||
          token.symbol?.toLowerCase().includes(searchLower) ||
          token.address?.toLowerCase().includes(searchLower),
      );
    }

    if (showOnlyEmpty) {
      filtered = filtered.filter(token => {
        const { bufferData } = token;
        return !bufferData.loading && !bufferData.error && bufferData.isInitialized === false;
      });
    }

    return filtered;
  }, [tokensWithBufferData, showOnlyEmpty, searchTerm, selectedNetwork, bufferBlocklist]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTokens = filteredTokens.slice(startIndex, endIndex);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredTokens.length / pageSize);
  }, [filteredTokens.length, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const networkOptionsV3 = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    const filteredNetworks = NETWORK_OPTIONS.filter(
      network => networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
    );

    return filteredNetworks;
  }, [addressBook]);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
    setCurrentPage(1);
  };

  const handleShowOnlyEmptyChange = (value: boolean) => {
    setShowOnlyEmpty(value);
    setCurrentPage(1);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="whiteAlpha.50">
            <Spinner size="lg" color="gray.400" />
          </Box>
          <Text fontSize="m" color="gray.500">
            Loading tokens...
          </Text>
        </Center>
      );
    }

    if (error || !data?.tokenGetTokens) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="red.400" opacity={0.2}>
            <Icon as={BiErrorCircle} w={8} h={8} color="red.700" />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="lg" fontWeight="medium">
              Failed to load tokens
            </Text>
            <Text fontSize="m" color="gray.400">
              Please check your connection and try again
            </Text>
          </VStack>
        </Center>
      );
    }

    if (paginatedTokens.length === 0 && !isBufferDataLoading) {
      return (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="gray.400" opacity={0.2}>
            <Icon as={BiErrorCircle} w={8} h={8} color="gray.700" />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="lg" fontWeight="medium">
              No tokens found
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
        <LiquidityBuffersTable
          tokens={paginatedTokens}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          loading={isBufferDataLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </VStack>
    );
  };

  return (
    <Container maxW="container.xl">
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "flex-end" }}
        justify="space-between"
        mb={6}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading as="h2" size="lg" variant="special" mb={2}>
            Liquidity Buffers
          </Heading>
          <Text>Manage liquidity buffers for tokens in Balancer v3.</Text>
        </Box>

        <Flex gap={4} align="center" minW="0">
          <Box minW="300px">
            <SearchInput
              search={searchTerm}
              setSearch={setSearchTerm}
              placeholder="Search..."
              ariaLabel="Search tokens"
              autoFocus={false}
            />
          </Box>
          <Box flexShrink={0}>
            <LiquidityBuffersFilters
              selectedNetwork={selectedNetwork}
              onNetworkChange={handleNetworkChange}
              networkOptions={networkOptionsV3}
              networks={networks}
              addressBook={addressBook}
              showOnlyEmpty={showOnlyEmpty}
              onShowOnlyEmptyChange={handleShowOnlyEmptyChange}
            />
          </Box>
        </Flex>
      </Flex>

      {renderContent()}
    </Container>
  );
}
