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
} from "@chakra-ui/react";
import RewardsInjectorCard from "@/components/RewardsInjectorCard";
import { networks } from "@/constants/constants";
import { calculateDistributionAmounts } from "@/lib/data/injector/helpers";
import { RefreshCw } from "react-feather";

const RewardsInjectorStatusPage = () => {
  const [injectorsData, setInjectorsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const toast = useToast();

  const fetchInjectorsData = async (forceReload = false) => {
    setIsLoading(true);
    try {
      const url = forceReload
        ? "/api/injector/all?forceReload=true"
        : "/api/injector/all";
      const response = await fetch(url);
      if (response.status === 429) {
        throw new Error(`Too many requests. Please try again in later.`);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch injectors data");
      }
      const data = await response.json();

      const processedData = data.map((injector: any) => {
        const { total, distributed, remaining } = calculateDistributionAmounts(
          injector.gauges,
        );

        const additionalTokensRequired =
          remaining > injector.contractBalance
            ? remaining - injector.contractBalance
            : 0;

        const incorrectlySetupGauges = injector.gauges.filter(
          (gauge: any) => !gauge.isRewardTokenSetup,
        );

        return {
          ...injector,
          total,
          distributed,
          remaining,
          additionalTokensRequired,
          incorrectlySetupGauges,
          isCompleted: distributed === total,
        };
      });

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

  useEffect(() => {
    fetchInjectorsData();
  }, []);

  const toggleHideCompleted = () => {
    setHideCompleted(!hideCompleted);
  };

  const handleRefresh = () => {
    fetchInjectorsData(true);
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
        <HStack justifyContent="space-between" alignItems="center">
          <Text>
            Showing {filteredInjectors.length} of {injectorsData.length}{" "}
            injectors
          </Text>
          <Button onClick={toggleHideCompleted}>
            {hideCompleted ? "Show All" : "Hide Completed"}
          </Button>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredInjectors.map((injector: any) => (
            <RewardsInjectorCard
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
