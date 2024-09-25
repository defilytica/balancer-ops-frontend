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
} from "@chakra-ui/react";
import RewardsInjectorCard from "@/components/RewardsInjectorCard";
import { networks } from "@/constants/constants";
import { calculateDistributionAmounts } from "@/lib/data/injector/helpers";

const RewardsInjectorPage = () => {
  const [injectorsData, setInjectorsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchInjectorsData = async () => {
      try {
        const response = await fetch("/api/injector/all");
        if (!response.ok) {
          throw new Error("Failed to fetch injectors data");
        }
        const data = await response.json();

        const processedData = data.map((injector : any) => {
          const { total, distributed, remaining } =
            calculateDistributionAmounts(injector.gauges);

          const additionalTokensRequired =
            remaining > injector.contractBalance
              ? remaining - injector.contractBalance
              : 0;

          const incorrectlySetupGauges = injector.gauges.filter(
            (gauge : any) => !gauge.isRewardTokenSetup,
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

        const sortedData = processedData.sort((a : any, b : any) => {
          const aHasIssues =
            a.additionalTokensRequired > 0 ||
            a.incorrectlySetupGauges.length > 0;
          const bHasIssues =
            b.additionalTokensRequired > 0 ||
            b.incorrectlySetupGauges.length > 0;

          if (aHasIssues && !bHasIssues) return -1;
          if (!aHasIssues && bHasIssues) return 1;
          return 0;
        });

        setInjectorsData(sortedData);
      } catch (err) {
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

    fetchInjectorsData();
  }, [toast]);

  const toggleHideCompleted = () => {
    setHideCompleted(!hideCompleted);
  };

  const filteredInjectors = hideCompleted
    ? injectorsData.filter((injector) => !injector.isCompleted)
    : injectorsData;

  if (isLoading) {
    return <Skeleton height="400px" />;
  }

  if (error) {
    return (
      <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.lg" justifyContent="center" alignItems="center">
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading as="h2" size="lg" variant="special">
            Injector Status Page
          </Heading>
        </Box>
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
          {filteredInjectors.map((injector) => (
            <RewardsInjectorCard
              key={injector.address}
              data={injector}
              networks={networks}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default RewardsInjectorPage;
