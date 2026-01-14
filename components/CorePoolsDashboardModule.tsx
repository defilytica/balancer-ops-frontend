"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  VStack,
  useColorModeValue,
  Select,
  HStack,
  Tooltip,
  Link,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { FaCircle } from "react-icons/fa";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import {
  GetV3PoolsQuery,
  GetV3PoolsDocument,
  GqlChain,
} from "@/lib/services/apollo/generated/graphql";
import { Pool, AddressBook } from "@/types/interfaces";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { CorePoolsTable } from "@/components/tables/CorePoolsTable";
import {
  CorePoolFeeData,
  DateRange,
  discoverAvailableDateRanges,
  fetchCorePoolsFeesForRange,
  calculateFeeDistributions,
  FEE_ALLOCATIONS,
} from "@/lib/services/fetchCorePoolsFees";
import { NetworkSelector } from "@/components/NetworkSelector";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";

interface CorePoolsDashboardModuleProps {
  addressBook: AddressBook;
}

export default function CorePoolsDashboardModule({
  addressBook,
}: CorePoolsDashboardModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("ALL");
  const [availableDateRanges, setAvailableDateRanges] = useState<DateRange[]>([]);
  const [selectedDateRangeIndex, setSelectedDateRangeIndex] = useState<number>(-1);
  const [feeData, setFeeData] = useState<CorePoolFeeData[]>([]);
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Color mode values
  const statsHeaderTextColor = useColorModeValue("gray.600", "gray.400");
  const statsBgColor = useColorModeValue("gray.50", "background.level2");
  const statsBorderColor = useColorModeValue("gray.100", "whiteAlpha.100");

  // Discover available date ranges on mount
  useEffect(() => {
    const discoverRanges = async () => {
      try {
        const ranges = await discoverAvailableDateRanges();
        setAvailableDateRanges(ranges);
        // Default to latest available range
        if (ranges.length > 0) {
          setSelectedDateRangeIndex(ranges.length - 1);
        }
      } catch (error) {
        console.error("Error discovering date ranges:", error);
        setFeeError("Failed to discover available date ranges");
      }
    };
    discoverRanges();
  }, []);

  // Fetch fee data when date range selection changes
  useEffect(() => {
    const fetchFees = async () => {
      if (availableDateRanges.length === 0 || selectedDateRangeIndex < 0) return;

      setIsLoadingFees(true);
      setFeeError(null);

      try {
        const range = availableDateRanges[selectedDateRangeIndex];
        const data = await fetchCorePoolsFeesForRange(range.startDate, range.endDate);
        setFeeData(data);
      } catch (error) {
        console.error("Error fetching fee data:", error);
        setFeeError("Failed to fetch fee data");
      } finally {
        setIsLoadingFees(false);
      }
    };

    fetchFees();
  }, [selectedDateRangeIndex, availableDateRanges]);

  // Get unique pool IDs from fee data for GraphQL query
  const poolIds = useMemo(() => feeData.map(d => d.pool_id), [feeData]);

  // Fetch pool data from GraphQL to enrich with logos and names
  const { loading: loadingPools, data: poolsData } = useQuery<GetV3PoolsQuery>(
    GetV3PoolsDocument,
    {
      variables: {
        chainNotIn: ["SEPOLIA" as GqlChain],
        idIn: poolIds.length > 0 ? poolIds : undefined,
      },
      skip: poolIds.length === 0,
    },
  );

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDateRangeIndex(parseInt(e.target.value, 10));
  };

  const networkOptionsWithAll = useMemo(() => {
    const baseOptions = [
      {
        label: "All networks",
        apiID: "ALL",
        chainId: "",
      },
    ];

    // Get networks that have v3 vaults
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");

    return [
      ...baseOptions,
      ...NETWORK_OPTIONS.filter(
        network =>
          networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
      ),
    ];
  }, [addressBook]);

  const networksWithAll = useMemo(
    () => ({
      ...networks,
      all: {
        logo: "/imgs/globe.svg",
        rpc: "",
        explorer: "",
        chainId: "",
      },
    }),
    [],
  );

  // Merge fee data with pool data
  const enrichedPoolData = useMemo(() => {
    const poolsMap = new Map<string, Pool>();
    if (poolsData?.poolGetPools) {
      for (const pool of poolsData.poolGetPools) {
        poolsMap.set(pool.address.toLowerCase(), pool as unknown as Pool);
      }
    }

    return feeData
      .map(fee => {
        const pool = poolsMap.get(fee.pool_id.toLowerCase());
        return {
          ...fee,
          pool,
          feesToVotingIncentives: fee.earned_fees * FEE_ALLOCATIONS.VOTING_INCENTIVES,
        };
      })
      .filter(item => {
        // Filter by network if selected
        if (selectedNetwork !== "ALL") {
          return item.chain.toUpperCase() === selectedNetwork;
        }
        return true;
      });
  }, [feeData, poolsData, selectedNetwork]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalFees = enrichedPoolData.reduce((sum, item) => sum + item.earned_fees, 0);
    return calculateFeeDistributions(totalFees);
  }, [enrichedPoolData]);

  const isLoading = isLoadingFees || loadingPools;

  return (
    <Container maxW="container.xl" py={8}>
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        mb={6}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading as="h2" size="lg" variant="special" mb={2}>
            Core Pools Dashboard
          </Heading>
          <Text>View fee earnings from Balancer v3 core pools</Text>
        </Box>

        <HStack spacing={4}>
          <Box>
            <Text fontSize="sm" mb={1} color={statsHeaderTextColor}>
              Date Range
            </Text>
            <Select
              value={selectedDateRangeIndex}
              onChange={handleDateRangeChange}
              minW="220px"
              size="sm"
            >
              {availableDateRanges.map((range, index) => (
                <option key={range.label} value={index}>
                  {range.label}
                </option>
              ))}
            </Select>
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color={statsHeaderTextColor}>
              Network
            </Text>
            <NetworkSelector
              networks={networksWithAll}
              networkOptions={networkOptionsWithAll}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
            />
          </Box>
        </HStack>
      </Flex>

      {/* Stats Overview Cards */}
      <SimpleGrid
        columns={{ base: 2, md: 4 }}
        spacing={4}
        p={4}
        bg={statsBgColor}
        borderRadius="lg"
        boxShadow="md"
        borderWidth={1}
        borderColor={statsBorderColor}
        mb={6}
      >
        <Tooltip label="Total fees earned by v3 core pools in the selected period" hasArrow>
          <VStack spacing={1} cursor="pointer">
            <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
              Total Fees Earned
            </Text>
            <Box fontSize="xl" fontWeight="semibold" h="28px" display="flex" alignItems="center">
              {isLoading ? <Spinner size="sm" /> : shortCurrencyFormat(totals.total)}
            </Box>
          </VStack>
        </Tooltip>

        <Tooltip label={`17.5% of earned fees allocated to the DAO treasury`} hasArrow>
          <VStack spacing={1} cursor="pointer">
            <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
              Fees to DAO (17.5%)
            </Text>
            <Box fontSize="xl" fontWeight="semibold" color="blue.400" h="28px" display="flex" alignItems="center">
              {isLoading ? <Spinner size="sm" /> : shortCurrencyFormat(totals.toDao)}
            </Box>
          </VStack>
        </Tooltip>

        <Tooltip label={`70% of earned fees allocated to voting incentives`} hasArrow>
          <VStack spacing={1} cursor="pointer">
            <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
              Voting Incentives (70%)
            </Text>
            <Box fontSize="xl" fontWeight="semibold" color="green.400" h="28px" display="flex" alignItems="center">
              {isLoading ? <Spinner size="sm" /> : shortCurrencyFormat(totals.toVotingIncentives)}
            </Box>
          </VStack>
        </Tooltip>

        <Tooltip label={`12.5% of earned fees allocated to veBAL holders`} hasArrow>
          <VStack spacing={1} cursor="pointer">
            <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
              Fees to veBAL (12.5%)
            </Text>
            <Box fontSize="xl" fontWeight="semibold" color="purple.400" h="28px" display="flex" alignItems="center">
              {isLoading ? <Spinner size="sm" /> : shortCurrencyFormat(totals.toVeBAL)}
            </Box>
          </VStack>
        </Tooltip>
      </SimpleGrid>

      {/* Info Box */}
      <Accordion allowToggle mb={6}>
        <AccordionItem border="none">
          <AccordionButton
            bg={statsBgColor}
            borderRadius="lg"
            borderWidth={1}
            borderColor={statsBorderColor}
            _hover={{ bg: statsBgColor }}
            px={4}
            py={3}
          >
            <HStack flex="1" textAlign="left" spacing={2}>
              <InfoOutlineIcon color="blue.400" />
              <Text fontWeight="medium">How does the Core Pools fee distribution work?</Text>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel
            pb={4}
            pt={4}
            bg={statsBgColor}
            borderRadius="lg"
            borderWidth={1}
            borderColor={statsBorderColor}
            borderTop="none"
            borderTopRadius={0}
            mt={-1}
          >
            <VStack align="start" spacing={3} fontSize="sm">
              <Text>
                This dashboard shows <strong>estimated</strong> voting incentives for a rolling
                2-week period. For details on the protocol fee model, see the{" "}
                <Link
                  href="https://docs.balancer.fi/concepts/protocol-fee-model/protocol-fee-model.html"
                  isExternal
                  color="blue.400"
                >
                  Balancer Protocol Fee Documentation
                </Link>
                .
              </Text>

              <List spacing={2}>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCircle} color="blue.400" boxSize={2} mt={1.5} />
                  <Box>
                    <strong>Collection periods:</strong> The actual bi-weekly periods for fee
                    collection and redistribution may vary. This data represents a sliding window
                    estimate.
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCircle} color="blue.400" boxSize={2} mt={1.5} />
                  <Box>
                    <strong>Minimum threshold:</strong> There is a dynamic minimum threshold for
                    fees to qualify for voting incentive distribution. The Aura market requires at
                    least 0.1% of votes to register, which translates to a minimum fee threshold. If
                    a pool does not meet this threshold, its fees are recycled to other eligible
                    pools.
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCircle} color="blue.400" boxSize={2} mt={1.5} />
                  <Box>
                    <strong>Core pool list:</strong> The list of core pools is updated every
                    Wednesday. Verify the current list{" "}
                    <Link
                      href="https://github.com/BalancerMaxis/bal_addresses/blob/main/outputs/core_pools.json"
                      isExternal
                      color="blue.400"
                    >
                      here
                    </Link>
                    .
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCircle} color="blue.400" boxSize={2} mt={1.5} />
                  <Box>
                    <strong>Effective fee runs:</strong> Actual distribution data is stored in the{" "}
                    <Link
                      href="https://github.com/BalancerMaxis/protocol_fee_allocator_v2/tree/biweekly-runs/fee_allocator/allocations/incentives"
                      isExternal
                      color="blue.400"
                    >
                      biweekly-runs branch
                    </Link>
                    .
                  </Box>
                </ListItem>
              </List>

              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <strong>Disclaimer:</strong> These figures are estimates only. Actual distribution
                  amounts may differ based on final collection periods, threshold requirements, and
                  market conditions.
                </Box>
              </Alert>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {feeError ? (
        <Alert status="error" mt={4}>
          <AlertIcon />
          <AlertTitle>Error loading fee data</AlertTitle>
          <AlertDescription>{feeError}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="whiteAlpha.50">
            <Spinner size="lg" color="gray.400" />
          </Box>
          <Text fontSize="m" color="gray.500">
            Loading core pools data...
          </Text>
        </Center>
      ) : enrichedPoolData.length === 0 ? (
        <Alert status="info" mt={4}>
          <AlertIcon />
          <AlertTitle>No core pools found</AlertTitle>
          <AlertDescription>
            No fee data available for the selected period and network
          </AlertDescription>
        </Alert>
      ) : (
        <CorePoolsTable pools={enrichedPoolData} />
      )}
    </Container>
  );
}
