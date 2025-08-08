"use client";
import { useState, useEffect } from "react";
import {
  SimpleGrid,
  Box,
  Text,
  Skeleton,
  useToast,
  Heading,
  Container,
  Button,
  VStack,
  HStack,
  IconButton,
  Tooltip,
  Switch,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
} from "@chakra-ui/react";
import RewardsInjectorCard from "@/components/RewardsInjectorCard";
import { networks } from "@/constants/constants";
import { calculateDistributionAmounts } from "@/lib/data/injector/helpers";
import { RefreshCw } from "react-feather";

const RewardsInjectorStatusPage = () => {
  const [injectorsData, setInjectorsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [hideStale, setHideStale] = useState(false);
  const [isV2, setIsV2] = useState(true);
  const toast = useToast();

  // Move useColorModeValue hooks to the top to avoid conditional hook calls
  const statsHeaderTextColor = useColorModeValue("gray.600", "gray.400");
  const statsBgColor = useColorModeValue("gray.50", "background.level2");
  const statsBorderColor = useColorModeValue("gray.100", "whiteAlpha.100");

  const processInjectorData = (injector: any) => {
    // Get decimals from tokenInfo if available (v2), otherwise use default handling
    const tokenDecimals = injector.tokenInfo?.decimals || 18;

    // Ensure contract balance is properly formatted based on decimals
    const rawContractBalance = parseFloat(injector.contractBalance);
    const adjustedContractBalance = isV2
      ? rawContractBalance
      : rawContractBalance / Math.pow(10, tokenDecimals);

    // Process gauges with proper decimal handling
    const processedGauges = injector.gauges.map((gauge: any) => ({
      ...gauge,
      amountPerPeriod: isV2
        ? gauge.amountPerPeriod // V2 amounts are already formatted in the API
        : parseFloat(gauge.rawAmountPerPeriod || "0") / Math.pow(10, tokenDecimals),
    }));

    const { total, distributed, remaining } = calculateDistributionAmounts(processedGauges);

    const additionalTokensRequired =
      remaining > injector.contractBalance ? remaining - adjustedContractBalance : 0;

    const incorrectlySetupGauges = injector.gauges.filter(
      (gauge: any) => !gauge.isRewardTokenSetup,
    );

    // Calculate if the injector is stale (all gauges haven't fired for more than 3 weeks)
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60; // 1 day in seconds
    const twoWeeksAgo = now - 14 * oneDayInSeconds;

    // Calculate if the injector has any gauges that haven't fired for more than 2 weeks
    const hasExpiredGauges = injector.gauges.some((gauge: any) => {
      const timestamp = parseInt(gauge.lastInjectionTimeStamp, 10);
      return timestamp > 0 && timestamp < twoWeeksAgo;
    });

    // Check if any gauge is approaching the 7-day mark (within 48h of reaching 7 days)
    const hasGaugesNearExpiration = injector.gauges.some((gauge: any) => {
      const timestamp = parseInt(gauge.lastInjectionTimeStamp, 10);
      if (timestamp === 0 || timestamp === null) return false;
      const expiryTime = timestamp + 7 * oneDayInSeconds;
      const timeUntilExpiry = expiryTime - now;
      return timeUntilExpiry > 0 && timeUntilExpiry <= 2 * oneDayInSeconds;
    });

    // Calculate if the injector is stale (all gauges haven't fired for more than 2 weeks)
    const isStale =
      injector.gauges.length > 0 &&
      injector.gauges.every((gauge: any) => {
        // Convert timestamp to number if it's a string
        const timestamp = parseInt(gauge.lastInjectionTimeStamp, 10);
        // If timestamp is 0, it means it has never been injected
        return timestamp === 0 || timestamp < twoWeeksAgo || timestamp === null;
      });

    return {
      ...injector,
      tokenDecimals,
      contractBalance: injector.contractBalance,
      total,
      distributed,
      remaining,
      additionalTokensRequired,
      incorrectlySetupGauges,
      isCompleted: (distributed === total && total > 0) || injector.gauges.length == 0,
      isStale,
      hasGaugesNearExpiration,
      hasExpiredGauges,
      processedGauges,
    };
  };

  const fetchInjectorsData = async (forceReload = false) => {
    setIsLoading(true);
    try {
      const version = isV2 ? "v2" : "v1";
      const url = `/api/injector/${version}/all?forceReload=${forceReload}`;
      const response = await fetch(url);

      if (response.status === 429) {
        throw new Error(`Too many requests. Please try again later.`);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch injectors data");
      }

      const data = await response.json();
      console.log("Raw injector data:", data); // Debug log

      // Process each injector's data with proper decimal handling
      const processedData = data.map((injector: any) => {
        const processed = processInjectorData(injector);
        console.log(`Processed injector ${injector.address}:`, processed); // Debug log
        return processed;
      });

      // Sort injectors with a multi-criteria approach:
      // 1. Issues first
      // 2. Most recent injection activity
      const sortedData = processedData.sort((a: any, b: any) => {
        const aHasIssues = a.additionalTokensRequired > 0 || a.incorrectlySetupGauges.length > 0;
        const bHasIssues = b.additionalTokensRequired > 0 || b.incorrectlySetupGauges.length > 0;

        // First priority: injectors with issues
        if (aHasIssues && !bHasIssues) return -1;
        if (!aHasIssues && bHasIssues) return 1;

        // Second priority: sort by most recent injection activity
        // Get the most recent injection timestamp from all gauges for each injector
        const getMostRecentInjection = (injector: any) => {
          if (!injector.gauges || injector.gauges.length === 0) return 0;
          return Math.max(
            ...injector.gauges.map((gauge: any) => parseInt(gauge.lastInjectionTimeStamp, 10) || 0),
          );
        };

        const aMostRecent = getMostRecentInjection(a);
        const bMostRecent = getMostRecentInjection(b);

        // Sort by most recent injection timestamp (descending - most recent first)
        return bMostRecent - aMostRecent;
      });

      setInjectorsData(sortedData);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error fetching data",
        description: err.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log("injector data", injectorsData);

  useEffect(() => {
    fetchInjectorsData();
  }, [isV2]);

  const toggleHideCompleted = () => {
    setHideCompleted(!hideCompleted);
  };

  const toggleHideStale = () => {
    setHideStale(!hideStale);
  };

  const handleRefresh = () => {
    fetchInjectorsData(true);
  };

  const handleVersionToggle = () => {
    setIsV2(!isV2);
  };

  let filteredInjectors = injectorsData;

  if (hideCompleted) {
    filteredInjectors = filteredInjectors.filter((injector: any) => !injector.isCompleted);
  }

  if (hideStale) {
    filteredInjectors = filteredInjectors.filter((injector: any) => !injector.isStale);
  }

  if (isLoading) {
    // Skeleton card visually matching RewardsInjectorCard
    const RewardsInjectorCardSkeleton = () => (
      <Box
        borderRadius="lg"
        boxShadow="md"
        p={{ base: 2, md: 4 }}
        minH="320px"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <HStack align="center" mb={4}>
          <Skeleton boxSize={8} borderRadius="full" flexShrink={0} />
          <VStack align="start" spacing={1} flex={1}>
            <Skeleton h={4} w="60%" />
            <Skeleton h={3} w="40%" />
          </VStack>
          <Skeleton h={6} w={"48px"} borderRadius="md" flexShrink={0} />
        </HStack>
        <VStack align="stretch" spacing={3} flex={1}>
          <HStack justify="space-between">
            <Skeleton h={4} w="40%" />
            <Skeleton h={4} w="20%" />
          </HStack>
          <HStack justify="space-between">
            <Skeleton h={4} w="40%" />
            <Skeleton h={4} w="20%" />
          </HStack>
          <Skeleton h={2} w="full" borderRadius="full" />
          <HStack justify="space-between">
            <Skeleton h={4} w="40%" />
            <Skeleton h={4} w="20%" />
          </HStack>
        </VStack>
        <Skeleton h={9} w="full" mt={4} borderRadius="md" />
      </Box>
    );

    return (
      <Container maxW="container.lg" justifyContent="center" alignItems="center">
        <VStack spacing={4} align="stretch">
          <HStack justifyContent="space-between" alignItems="center">
            <Skeleton h={8} w="40%" />
            <Skeleton h={8} w="10%" />
          </HStack>
          <Skeleton h={20} w="full" />
          <Skeleton h={10} w="full" />
          <HStack justifyContent="space-between" alignItems="center" spacing={1}>
            <Skeleton h={6} w="30%" />
            <HStack spacing={2} w="60%">
              <Skeleton h={8} w="30%" />
              <Skeleton h={8} w="30%" />
              <Skeleton h={8} w="20%" />
            </HStack>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {[...Array(6)].map((_, i) => (
              <RewardsInjectorCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  // Calculate stats for display
  const stats = {
    total: injectorsData.length,
    expired: injectorsData.filter((injector: any) => injector.hasExpiredGauges).length,
    needsAttention: injectorsData.filter((injector: any) => injector.hasGaugesNearExpiration)
      .length,
    stale: injectorsData.filter((injector: any) => injector.isStale).length,
  };

  return (
    <Container maxW="container.lg" justifyContent="center" alignItems="center">
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading as="h2" size="lg" variant="special">
            Injector Status Page
          </Heading>
          <Tooltip label="The data is refreshed every 24 hours, if you want more up-to-date data you can fetch it manually.">
            <IconButton
              aria-label="Refresh data"
              icon={<RefreshCw />}
              onClick={handleRefresh}
              isDisabled={isLoading}
            />
          </Tooltip>
        </HStack>
        {/* Compact Stats Overview */}
        <SimpleGrid
          columns={4}
          spacing={4}
          p={4}
          bg={statsBgColor}
          borderRadius="lg"
          boxShadow="md"
          borderWidth={1}
          borderColor={statsBorderColor}
          mb={1}
        >
          <VStack spacing={1}>
            <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
              Total injectors
            </Text>
            <Text fontSize="xl" fontWeight="semibold">
              {stats.total}
            </Text>
          </VStack>
          <Tooltip label="Some gauges are about to expire" hasArrow>
            <VStack spacing={1} cursor="pointer">
              <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
                Needs attention
              </Text>
              <Text fontSize="xl" fontWeight="semibold">
                {stats.needsAttention}
              </Text>
            </VStack>
          </Tooltip>
          <Tooltip
            label="Injectors have some gauges that are expired and are no longer distributing rewards"
            hasArrow
          >
            <VStack spacing={1} cursor="pointer">
              <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
                With expired gauges
              </Text>
              <Text fontSize="xl" fontWeight="semibold">
                {stats.expired}
              </Text>
            </VStack>
          </Tooltip>
          <Tooltip label="All gauges haven't fired for more than 2 weeks" hasArrow>
            <VStack spacing={1} cursor="pointer">
              <Text fontSize="xs" color={statsHeaderTextColor} textAlign="center">
                Stale
              </Text>
              <Text fontSize="xl" fontWeight="semibold">
                {stats.stale}
              </Text>
            </VStack>
          </Tooltip>
        </SimpleGrid>
        <Alert status="warning" mr={4}>
          <AlertIcon />
          <Box>
            <AlertDescription>
              This data is cached and was last updated on{" "}
              {injectorsData.length > 0 && new Date(injectorsData[0].updatedAt).toLocaleString()}.
              You can refresh the data manually.
            </AlertDescription>
          </Box>
        </Alert>
        <HStack justifyContent="space-between" alignItems="center" spacing={1}>
          <Text>
            Showing {filteredInjectors.length} of {injectorsData.length} injectors
          </Text>
          <HStack spacing={2}>
            <Button onClick={toggleHideCompleted}>
              {hideCompleted ? "Show All" : "Hide Completed"}
            </Button>
            <Button onClick={toggleHideStale}>{hideStale ? "Show All" : "Hide Inactive"}</Button>
            <HStack>
              <Text>V1</Text>
              <Switch isChecked={isV2} onChange={handleVersionToggle} />
              <Text>V2</Text>
            </HStack>
          </HStack>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredInjectors.map((injector: any) => (
            <RewardsInjectorCard
              v2={isV2}
              key={injector.address + injector.network}
              data={injector}
              networks={networks}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default RewardsInjectorStatusPage;
