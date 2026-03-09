import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { NetworkSelector } from "@/components/NetworkSelector";
import { RewardTokensFilters } from "@/components/filter/RewardTokensFilters";
import { useRewardTokenData } from "@/lib/hooks/useRewardTokenData";
import { RewardTokenData } from "@/types/rewardTokenTypes";
import { networks } from "@/constants/constants";
import { getNetworksForFeature } from "@/constants/networkFeatures";
import { useAccount } from "wagmi";
import { useQuery } from "@apollo/client/react";
import {
  GetTokensDocument,
  GetTokensQuery,
  GetTokensQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import RewardTokensTable from "@/components/tables/RewardTokensTable";
import AddRewardsModal from "@/components/modal/AddRewardsModal";
import { getExplorerUrl } from "@/lib/utils/getExplorerUrl";

enum Sorting {
  Asc = "asc",
  Desc = "desc",
}

type SortField = "tvl" | "rewardTokenCount" | "status";

interface RewardTokensOverviewProps {}

const RewardTokensOverview: React.FC<RewardTokensOverviewProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const gaugeRewardsNetworks = useMemo(() => getNetworksForFeature("gaugeRewards"), []);

  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);
  const [showDistributorOnly, setShowDistributorOnly] = useState<boolean>(false);
  const [showWithRewardsOnly, setShowWithRewardsOnly] = useState<boolean>(true);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [selectedPool, setSelectedPool] = useState<RewardTokenData | null>(null);
  const [injectorAddresses, setInjectorAddresses] = useState<Set<string>>(new Set());
  const [v2InjectorAddresses, setV2InjectorAddresses] = useState<Set<string>>(new Set());
  const [shouldOpenModalOnDataLoad, setShouldOpenModalOnDataLoad] = useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("tvl");
  const [sortDirection, setSortDirection] = useState<Sorting>(Sorting.Desc);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const { data, loading, error, refetch } = useRewardTokenData(selectedNetwork);
  const { address, isConnected } = useAccount();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const statBorderColor = useColorModeValue("gray.200", "gray.600");

  // Optimized token data fetching with early logo loading
  const tokenAddresses = useMemo(() => {
    if (!data) return [];
    const addresses = new Set<string>();
    data.forEach(pool => {
      pool.rewardTokens.forEach(token => {
        addresses.add(token.address);
      });
      pool.poolTokens?.forEach(token => {
        addresses.add(token.address);
      });
    });
    return Array.from(addresses);
  }, [data]);

  // Prefetch token logos as soon as we have the network and any data
  const { data: tokenData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(GetTokensDocument, {
    variables: {
      chainIn: [selectedNetwork as any],
      tokensIn: tokenAddresses,
    },
    skip: !selectedNetwork || tokenAddresses.length === 0,
    fetchPolicy: "cache-first",
    errorPolicy: "ignore",
  });

  // Optimized token logos mapping with memoization
  const tokenLogos = useMemo(() => {
    if (!tokenData?.tokenGetTokens) return {};
    const logoMap: { [address: string]: string } = {};
    tokenData.tokenGetTokens.forEach(token => {
      logoMap[token.address.toLowerCase()] = token.logoURI || "";
    });
    return logoMap;
  }, [tokenData]);

  // Process URL parameters on initial load and network/data changes
  useEffect(() => {
    const network = searchParams.get("network");
    const gaugeAddress = searchParams.get("gauge");
    const tokenAddress = searchParams.get("token");

    if (network && !selectedNetwork) {
      setSelectedNetwork(network);
      if (gaugeAddress && tokenAddress) {
        setShouldOpenModalOnDataLoad(true);
      }
    }

    if (data && shouldOpenModalOnDataLoad && gaugeAddress && tokenAddress) {
      const pool = data.find(p => p.gaugeAddress.toLowerCase() === gaugeAddress.toLowerCase());

      if (pool) {
        const token = pool.rewardTokens.find(
          t => t.address.toLowerCase() === tokenAddress.toLowerCase(),
        );

        if (token) {
          setSelectedPool(pool);
          setSelectedToken(token);
          onOpen();
          setShouldOpenModalOnDataLoad(false);
        }
      }
    }
  }, [searchParams, data, selectedNetwork, shouldOpenModalOnDataLoad, onOpen]);

  // Reset distributor filter when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      setShowDistributorOnly(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    const fetchAllInjectorAddresses = async () => {
      try {
        const [v1Response, v2Response] = await Promise.all([
          fetch("/api/injector/v1/all").catch(() => ({ ok: false, status: 500 })),
          fetch("/api/injector/v2/all").catch(() => ({ ok: false, status: 500 })),
        ]);

        const addresses = new Set<string>();
        const v2Addresses = new Set<string>();

        if (v1Response.ok) {
          try {
            const v1Data = await (v1Response as Response).json();
            if (Array.isArray(v1Data)) {
              v1Data.forEach((injector: any) => {
                if (injector?.address) {
                  addresses.add(injector.address.toLowerCase());
                }
              });
            }
          } catch (error) {
            console.warn("Error processing v1 injector data:", error);
          }
        }

        if (v2Response.ok) {
          try {
            const v2Data = await (v2Response as Response).json();
            if (Array.isArray(v2Data)) {
              v2Data.forEach((injector: any) => {
                if (injector?.address) {
                  addresses.add(injector.address.toLowerCase());
                  v2Addresses.add(injector.address.toLowerCase());
                }
              });
            }
          } catch (error) {
            console.warn("Error processing v2 injector data:", error);
          }
        }

        setInjectorAddresses(addresses);
        setV2InjectorAddresses(v2Addresses);
      } catch (error) {
        console.warn("Error fetching injector addresses:", error);
      }
    };

    fetchAllInjectorAddresses();
  }, []);

  const isRewardInjector = (distributorAddress: string) => {
    return injectorAddresses.has(distributorAddress.toLowerCase());
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    updateUrlParams({});
  };

  const updateUrlParams = useCallback(
    (params: Record<string, string>) => {
      const newSearchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) newSearchParams.set(key, value);
      });
      const queryString = newSearchParams.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  const formatEndDate = (periodFinish: string) => {
    const timestamp = parseInt(periodFinish);
    if (timestamp === 0) return "No end date";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const isDistributor = (tokenDistributor: string): boolean => {
    return !!(address && address.toLowerCase() === tokenDistributor.toLowerCase());
  };

  const isDistributorForPool = (pool: RewardTokenData) => {
    return pool.rewardTokens.some(token => isDistributor(token.distributor));
  };

  const openAddRewardsModal = (pool: RewardTokenData, token: any) => {
    setSelectedPool(pool);
    setSelectedToken(token);
    updateUrlParams({
      network: selectedNetwork,
      gauge: pool.gaugeAddress,
      token: token.address,
    });
    onOpen();
  };

  const closeAddRewardsModal = () => {
    setSelectedPool(null);
    setSelectedToken(null);
    updateUrlParams({});
    onClose();
  };

  const handleModalSuccess = () => {
    toast({
      title: "Rewards added successfully!",
      description: "Your reward tokens have been deposited to the gauge",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    if (data) {
      refetch();
    }
  };

  // Memoized function to check if pool has active rewards
  const hasActiveRewards = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return (pool: RewardTokenData) => {
      return pool.rewardTokens.some(token => {
        const rate = parseFloat(token.rate);
        const periodFinish = parseInt(token.period_finish);
        if (periodFinish > 0 && periodFinish <= currentTime) {
          return false;
        }
        return rate > 0;
      });
    };
  }, []);

  // Sort handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === Sorting.Asc ? Sorting.Desc : Sorting.Asc);
      } else {
        setSortField(field);
        setSortDirection(Sorting.Desc);
      }
      setCurrentPage(1);
    },
    [sortField, sortDirection],
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showActiveOnly, showDistributorOnly, showWithRewardsOnly, selectedNetwork]);

  // Summary stats from full data
  const summaryStats = useMemo(() => {
    if (!data) return { totalWithGauges: 0, activeRewards: 0, uniqueRewardTokens: 0 };
    const uniqueTokens = new Set<string>();
    let activeCount = 0;
    data.forEach(pool => {
      if (hasActiveRewards(pool)) activeCount++;
      pool.rewardTokens.forEach(token => uniqueTokens.add(token.address.toLowerCase()));
    });
    return {
      totalWithGauges: data.length,
      activeRewards: activeCount,
      uniqueRewardTokens: uniqueTokens.size,
    };
  }, [data, hasActiveRewards]);

  // Filter → Sort → Paginate pipeline
  const filteredData = useMemo(() => {
    if (!data) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter(pool => {
      if (showWithRewardsOnly && pool.rewardTokens.length === 0) {
        return false;
      }

      if (searchTerm) {
        const poolMatches =
          pool.poolName.toLowerCase().includes(lowerSearchTerm) ||
          pool.poolSymbol.toLowerCase().includes(lowerSearchTerm);

        const rewardTokenMatches = pool.rewardTokens.some(
          token =>
            token.symbol.toLowerCase().includes(lowerSearchTerm) ||
            token.name.toLowerCase().includes(lowerSearchTerm),
        );

        if (!poolMatches && !rewardTokenMatches) {
          return false;
        }
      }

      if (showActiveOnly && !hasActiveRewards(pool)) {
        return false;
      }

      if (showDistributorOnly && (!address || !isDistributorForPool(pool))) {
        return false;
      }

      return true;
    });
  }, [
    data,
    searchTerm,
    showActiveOnly,
    showDistributorOnly,
    showWithRewardsOnly,
    address,
    hasActiveRewards,
  ]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    const currentTime = Math.floor(Date.now() / 1000);
    sorted.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortField === "tvl") {
        aValue = parseFloat(a.totalLiquidity || "0");
        bValue = parseFloat(b.totalLiquidity || "0");
      } else if (sortField === "rewardTokenCount") {
        aValue = a.rewardTokens.length;
        bValue = b.rewardTokens.length;
      } else {
        // status: active=1, inactive with tokens=0.5, none=0
        const getStatusScore = (pool: RewardTokenData) => {
          if (pool.rewardTokens.length === 0) return 0;
          const hasActive = pool.rewardTokens.some(token => {
            const rate = parseFloat(token.rate);
            const periodFinish = parseInt(token.period_finish);
            if (periodFinish > 0 && periodFinish <= currentTime) return false;
            return rate > 0;
          });
          return hasActive ? 1 : 0.5;
        };
        aValue = getStatusScore(a);
        bValue = getStatusScore(b);
      }

      return sortDirection === Sorting.Asc ? aValue - bValue : bValue - aValue;
    });
    return sorted;
  }, [filteredData, sortField, sortDirection]);

  const totalPageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const paginationProps = useMemo(
    () => ({
      currentPageNumber: currentPage,
      totalPageCount,
      pageSize,
      canPreviousPage: currentPage > 1,
      canNextPage: currentPage < totalPageCount,
      goToFirstPage: () => setCurrentPage(1),
      goToLastPage: () => setCurrentPage(totalPageCount),
      goToNextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPageCount)),
      goToPreviousPage: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
      setPageSize: (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
      },
    }),
    [currentPage, totalPageCount, pageSize],
  );

  // Show network selector first if no network is selected
  if (!selectedNetwork) {
    return (
      <VStack spacing={4} align="start">
        <Box maxW="300px">
          <NetworkSelector
            networks={networks}
            networkOptions={gaugeRewardsNetworks}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </Box>
      </VStack>
    );
  }

  if (loading) {
    return (
      <Box>
        <HStack spacing={4} mb={6} alignItems="end">
          <Box maxW="300px">
            <NetworkSelector
              networks={networks}
              networkOptions={gaugeRewardsNetworks}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </Box>
          <Button onClick={() => refetch()} isDisabled={loading}>
            Refresh
          </Button>
        </HStack>

        <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading reward token data for {selectedNetwork}...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <HStack spacing={4} mb={6} alignItems="end">
          <Box maxW="300px">
            <NetworkSelector
              networks={networks}
              networkOptions={gaugeRewardsNetworks}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </Box>
          <Button onClick={() => refetch()} isDisabled={loading}>
            Refresh
          </Button>
        </HStack>

        <Alert status="error">
          <AlertIcon />
          Error loading reward token data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <HStack spacing={4} mb={6} alignItems="end">
        <Box maxW="300px">
          <NetworkSelector
            networks={networks}
            networkOptions={gaugeRewardsNetworks}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </Box>
        <Button onClick={() => refetch()}>Refresh</Button>
      </HStack>

      <HStack spacing={4} mb={6}>
        <InputGroup maxW="400px">
          <InputLeftElement>
            <SearchIcon color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Search pools or reward tokens..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <RewardTokensFilters
          showWithRewardsOnly={showWithRewardsOnly}
          onShowWithRewardsOnlyChange={setShowWithRewardsOnly}
          showActiveOnly={showActiveOnly}
          onShowActiveOnlyChange={setShowActiveOnly}
          showDistributorOnly={showDistributorOnly}
          onShowDistributorOnlyChange={setShowDistributorOnly}
          isDistributorDisabled={!isConnected || !address}
        />
      </HStack>

      {/* Summary stats */}
      <HStack spacing={4} mb={6}>
        <Box px={4} py={3} border="1px" borderColor={statBorderColor} borderRadius="md" flex="1">
          <Text fontSize="xs" color="font.secondary">
            Pools with Gauges
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {summaryStats.totalWithGauges}
          </Text>
        </Box>
        <Box px={4} py={3} border="1px" borderColor={statBorderColor} borderRadius="md" flex="1">
          <Text fontSize="xs" color="font.secondary">
            Gauges with Rewards
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="green.500">
            {summaryStats.activeRewards}
          </Text>
        </Box>
        <Box px={4} py={3} border="1px" borderColor={statBorderColor} borderRadius="md" flex="1">
          <Text fontSize="xs" color="font.secondary">
            Unique Reward Tokens
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {summaryStats.uniqueRewardTokens}
          </Text>
        </Box>
      </HStack>

      <RewardTokensTable
        data={paginatedData}
        loading={loading}
        selectedNetwork={selectedNetwork}
        tokenLogos={tokenLogos}
        injectorAddresses={injectorAddresses}
        v2InjectorAddresses={v2InjectorAddresses}
        isRewardInjector={isRewardInjector}
        isDistributor={isDistributor}
        onAddRewards={openAddRewardsModal}
        getExplorerUrl={(address: string) => getExplorerUrl(selectedNetwork, address)}
        formatEndDate={formatEndDate}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        showPagination={sortedData.length > pageSize}
        paginationProps={paginationProps}
      />

      <AddRewardsModal
        isOpen={isOpen}
        onClose={closeAddRewardsModal}
        selectedPool={selectedPool}
        selectedToken={selectedToken}
        selectedNetwork={selectedNetwork}
        formatEndDate={formatEndDate}
        onSuccess={handleModalSuccess}
        isDistributor={isDistributor}
      />
    </Box>
  );
};

export default RewardTokensOverview;
