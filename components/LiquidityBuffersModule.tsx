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
import { useState, useMemo } from "react";
import { AddressBook, TokenListToken } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";

interface LiquidityBuffersModuleProps {
  addressBook: AddressBook;
}

export default function LiquidityBuffersModule({ addressBook }: LiquidityBuffersModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("MAINNET");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTokens = allTokens.slice(startIndex, endIndex);

  const totalPages = useMemo(() => {
    return Math.ceil(allTokens.length / pageSize);
  }, [allTokens.length, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
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
    setCurrentPage(1); // Reset to first page when changing network
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
    <Container maxW="container.xl" py={8}>
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
          />
        </Box>
      </Flex>

      {renderContent()}
    </Container>
  );
}
