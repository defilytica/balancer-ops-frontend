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
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useState, useMemo, useEffect } from "react";
import { AddressBook, TokenListToken, BufferData, TokenWithBufferData } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { fetchBufferInitializationStatus } from "@/lib/services/fetchBufferInitializationStatus";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";

interface LiquidityBuffersModuleProps {
  addressBook: AddressBook;
}

export default function LiquidityBuffersModule({ addressBook }: LiquidityBuffersModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("MAINNET");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
  const [bufferDataMap, setBufferDataMap] = useState<Map<string, BufferData>>(new Map());

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

  // Fetch buffer data for ERC4626 tokens
  const fetchBufferData = async (token: TokenListToken): Promise<BufferData | null> => {
    if (!token.isErc4626 || !token.underlyingTokenAddress) {
      return null;
    }

    const [initStatus, balanceData] = await Promise.all([
      fetchBufferInitializationStatus(token.address, token.chain?.toLowerCase() || ""),
      fetchBufferBalance(token.address, token.chain?.toLowerCase() || ""),
    ]);

    const totalBalance = balanceData.underlyingBalance + balanceData.wrappedBalance;
    const balancePercentage =
      totalBalance > BigInt(0)
        ? Number((balanceData.wrappedBalance * BigInt(100)) / totalBalance)
        : 0;

    return {
      isInitialized: initStatus,
      balancePercentage,
      underlyingBalance: balanceData.underlyingBalance,
      wrappedBalance: balanceData.wrappedBalance,
      loading: false,
    };
  };

  useEffect(() => {
    allTokens.forEach(async token => {
      const key = `${token.address}-${token.chain}`;
      if (!bufferDataMap.has(key)) {
        setBufferDataMap(prev => new Map(prev.set(key, { loading: true })));

        try {
          const bufferData = await fetchBufferData(token);
          if (bufferData) {
            setBufferDataMap(prev => new Map(prev.set(key, bufferData)));
          }
        } catch (error) {
          console.error(`Error fetching buffer data for ${token.symbol}:`, error);
          setBufferDataMap(
            prev =>
              new Map(
                prev.set(key, {
                  loading: false,
                  error: true,
                }),
              ),
          );
        }
      }
    });
  }, [allTokens, bufferDataMap]);

  const getBufferData = (token: TokenListToken): BufferData => {
    const key = `${token.address}-${token.chain}`;
    return bufferDataMap.get(key) || { loading: false };
  };

  // Create tokens with buffer data
  const tokensWithBufferData: TokenWithBufferData[] = useMemo(() => {
    return allTokens.map(token => ({
      ...token,
      bufferData: getBufferData(token),
    }));
  }, [allTokens, bufferDataMap]);

  const filteredTokens = useMemo(() => {
    if (!showOnlyEmpty) {
      return tokensWithBufferData;
    }

    return tokensWithBufferData.filter(token => {
      if (!token.isErc4626 || !token.underlyingTokenAddress) {
        return false;
      }
      const { bufferData } = token;
      return !bufferData.loading && !bufferData.error && bufferData.isInitialized === false;
    });
  }, [tokensWithBufferData, showOnlyEmpty]);

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

    if (paginatedTokens.length === 0) {
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
          loading={false}
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
          <Text>Manage liquidity buffers for tokens in Balancer v3.</Text>
        </Box>

        <Box>
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

      {renderContent()}
    </Container>
  );
}
