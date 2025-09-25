import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { NetworkSelector } from "@/components/NetworkSelector";
import { useRewardTokenData } from "@/lib/hooks/useRewardTokenData";
import { RewardTokenData } from "@/types/rewardTokenTypes";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useAccount } from "wagmi";
import { useQuery } from "@apollo/client";
import {
  GetTokensDocument,
  GetTokensQuery,
  GetTokensQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import RewardTokensTable from "@/components/tables/RewardTokensTable";
import AddRewardsModal from "@/components/modal/AddRewardsModal";
import { getExplorerUrl } from "@/lib/utils/getExplorerUrl";

interface RewardTokensOverviewProps {}

const RewardTokensOverview: React.FC<RewardTokensOverviewProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);
  const [showDistributorOnly, setShowDistributorOnly] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [selectedPool, setSelectedPool] = useState<RewardTokenData | null>(null);
  const [injectorAddresses, setInjectorAddresses] = useState<Set<string>>(new Set());
  const [v2InjectorAddresses, setV2InjectorAddresses] = useState<Set<string>>(new Set());
  const [shouldOpenModalOnDataLoad, setShouldOpenModalOnDataLoad] = useState<boolean>(false);

  const { data, loading, error, refetch } = useRewardTokenData(selectedNetwork);
  const { address, isConnected } = useAccount();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Optimized token data fetching with early logo loading
  const tokenAddresses = useMemo(() => {
    if (!data) return [];
    const addresses = new Set<string>();
    data.forEach(pool => {
      // Include reward tokens
      pool.rewardTokens.forEach(token => {
        addresses.add(token.address);
      });
      // Include pool tokens
      pool.poolTokens?.forEach(token => {
        if (!token.isNested && !token.isPhantomBpt) {
          addresses.add(token.address);
        }
      });
    });
    return Array.from(addresses);
  }, [data]);

  // Prefetch token logos as soon as we have the network and any data
  const { data: tokenData, loading: tokenDataLoading } = useQuery<
    GetTokensQuery,
    GetTokensQueryVariables
  >(GetTokensDocument, {
    variables: {
      chainIn: [selectedNetwork as any],
      tokensIn: tokenAddresses,
    },
    skip: !selectedNetwork || tokenAddresses.length === 0,
    // Add caching and performance optimizations
    fetchPolicy: "cache-first",
    errorPolicy: "ignore", // Don't break the UI if token logos fail
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

    // If data is loaded and we have all required params, open the modal
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

  // Optimized injector address fetching
  // Reset distributor filter when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      setShowDistributorOnly(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    const fetchAllInjectorAddresses = async () => {
      try {
        // Use the optimized endpoints from rewards-injector status page
        const [v1Response, v2Response] = await Promise.all([
          fetch("/api/injector/v1/all").catch(() => ({ ok: false, status: 500 })),
          fetch("/api/injector/v2/all").catch(() => ({ ok: false, status: 500 })),
        ]);

        const addresses = new Set<string>();
        const v2Addresses = new Set<string>();

        // Process V1 data
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

        // Process V2 data (using the bulk endpoint like rewards-injector status page)
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

  // Check if a distributor address is a reward injector
  const isRewardInjector = (distributorAddress: string) => {
    return injectorAddresses.has(distributorAddress.toLowerCase());
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    // Clear URL params when network changes
    updateUrlParams({});
  };

  // Function to update URL with query parameters
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

    // Update URL with modal parameters (simplified - using gauge as unique identifier)
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

    // Clear URL params when modal closes
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
    // Optimized refresh - only refetch if needed
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
        // Active if rate > 0 and period hasn't finished (or is indefinite with periodFinish = 0)
        // Fix: If periodFinish > 0 and < currentTime, reward is expired regardless of rate
        if (periodFinish > 0 && periodFinish <= currentTime) {
          return false; // Expired reward
        }
        return rate > 0;
      });
    };
  }, []);

  // Optimized filter and search logic with memoization
  const sortedData = useMemo(() => {
    if (!data) return [];

    // Pre-compute search term for performance
    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter(pool => {
      // Search filter - check pool name, symbol, and reward token names/symbols
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

      // Active rewards filter
      if (showActiveOnly && !hasActiveRewards(pool)) {
        return false;
      }

      // Distributor filter (only check if user is connected)
      if (showDistributorOnly && (!address || !isDistributorForPool(pool))) {
        return false;
      }

      return true;
    });
  }, [data, searchTerm, showActiveOnly, showDistributorOnly, address, hasActiveRewards]);

  // Show network selector first if no network is selected
  if (!selectedNetwork) {
    return (
      <VStack spacing={4} align="start">
        <Box maxW="300px">
          <NetworkSelector
            networks={networks}
            networkOptions={NETWORK_OPTIONS}
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
              networkOptions={NETWORK_OPTIONS}
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
              networkOptions={NETWORK_OPTIONS}
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
            networkOptions={NETWORK_OPTIONS}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </Box>
        <Button onClick={() => refetch()}>Refresh</Button>
      </HStack>

      <VStack spacing={4} mb={6}>
        <VStack spacing={3} width="100%" align="start">
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
          <HStack spacing={6}>
            <Checkbox
              isChecked={showActiveOnly}
              onChange={e => setShowActiveOnly(e.target.checked)}
              colorScheme="green"
            >
              Pools with active rewards
            </Checkbox>
            <Checkbox
              isChecked={showDistributorOnly}
              onChange={e => setShowDistributorOnly(e.target.checked)}
              colorScheme="blue"
              isDisabled={!isConnected || !address}
            >
              Pools with connected wallet as distributor
            </Checkbox>
          </HStack>
        </VStack>
      </VStack>

      <RewardTokensTable
        data={sortedData || []}
        selectedNetwork={selectedNetwork}
        tokenLogos={tokenLogos}
        injectorAddresses={injectorAddresses}
        v2InjectorAddresses={v2InjectorAddresses}
        isRewardInjector={isRewardInjector}
        isDistributor={isDistributor}
        onAddRewards={openAddRewardsModal}
        getExplorerUrl={(address: string) => getExplorerUrl(selectedNetwork, address)}
        formatEndDate={formatEndDate}
      />

      {(!sortedData || sortedData.length === 0) && (
        <Box textAlign="center" py={8}>
          <Text color="font.secondary">
            {searchTerm || showActiveOnly || showDistributorOnly
              ? `No pools or reward tokens found${searchTerm ? ` matching "${searchTerm}"` : ""}${showActiveOnly ? " with active rewards" : ""}${showDistributorOnly ? " where you're a distributor" : ""} on ${selectedNetwork}`
              : `No pools with gauges found for ${selectedNetwork}`}
          </Text>
        </Box>
      )}

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
