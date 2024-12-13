"use client";
import React, { useState, useEffect } from "react";
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
  const [isV2, setIsV2] = useState(false);
  const toast = useToast();

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
          : parseFloat(gauge.rawAmountPerPeriod || '0') / Math.pow(10, tokenDecimals),
    }));

    const { total, distributed, remaining } = calculateDistributionAmounts(processedGauges);

    const additionalTokensRequired =
        remaining > adjustedContractBalance
            ? remaining - adjustedContractBalance
            : 0;

    const incorrectlySetupGauges = injector.gauges.filter(
        (gauge: any) => !gauge.isRewardTokenSetup
    );

    return {
      ...injector,
      tokenDecimals,
      contractBalance: adjustedContractBalance,
      total,
      distributed,
      remaining,
      additionalTokensRequired,
      incorrectlySetupGauges,
      isCompleted: distributed === total && total > 0,
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

      // Sort injectors with issues first
      const sortedData = processedData.sort((a: any, b: any) => {
        const aHasIssues =
            a.additionalTokensRequired > 0 || a.incorrectlySetupGauges.length > 0;
        const bHasIssues =
            b.additionalTokensRequired > 0 || b.incorrectlySetupGauges.length > 0;

        if (aHasIssues && !bHasIssues) return -1;
        if (!aHasIssues && bHasIssues) return 1;
        return 0;
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

  const handleRefresh = () => {
    fetchInjectorsData(true);
  };

  const handleVersionToggle = () => {
    setIsV2(!isV2);
  };

  const filteredInjectors = hideCompleted
    ? injectorsData.filter((injector: any) => !injector.isCompleted)
    : injectorsData;

  if (isLoading) {
    return <Skeleton height="400px" />;
  }

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
        <Alert status="warning" mr={4}>
          <AlertIcon />
          <Box>
            <AlertDescription>
              This data is cached and was last updated on{" "}
              {new Date(injectorsData[0].updatedAt).toLocaleString()}. You can
              refresh the data manually.
            </AlertDescription>
          </Box>
        </Alert>
        <HStack justifyContent="space-between" alignItems="center">
          <Text>
            Showing {filteredInjectors.length} of {injectorsData.length}{" "}
            injectors
          </Text>
          <HStack>
            <Button onClick={toggleHideCompleted}>
              {hideCompleted ? "Show All" : "Hide Completed"}
            </Button>
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
