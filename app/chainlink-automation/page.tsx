"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  Heading,
  HStack,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { ChainlinkData } from "@/types/interfaces";
import { fetchChainlinkData } from "@/lib/services/fetchChainlinkData";
import { ChainlinkTable } from "@/components/tables/ChainlinkTable";

const ChainlinkAutomationPage: React.FC = () => {
  const [chainlinkData, setChainlinkData] = useState<ChainlinkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: showInactive, onToggle } = useDisclosure();

  useEffect(() => {
    const loadData = async () => {
      try {
        const rawData = (await fetchChainlinkData()) as any[];
        const processedData: ChainlinkData[] = rawData.map(row => ({
          ...row,
          upkeep_balance: parseFloat(row.upkeep_balance),
          total_link_payments: parseFloat(row.total_link_payments),
          total_performs: parseInt(row.total_performs),
          link_per_perform: parseFloat(row.link_per_perform),
          estimated_actions_left: Math.floor(
            parseFloat(row.upkeep_balance) / parseFloat(row.link_per_perform),
          ),
        }));
        setChainlinkData(processedData);
      } catch (error) {
        console.error("Error fetching Chainlink data:", error);
      }
    };

    loadData();
    setIsLoading(false);
  }, []);

  // Filter data
  const activeUpkeepers = chainlinkData.filter(
    item => item.upkeep_status.toLowerCase() === "active",
  );

  const inactiveUpkeepers = chainlinkData.filter(
    item => item.upkeep_status.toLowerCase() !== "active",
  );

  // Calculate summary statistics
  const totalActiveBalance = activeUpkeepers.reduce((sum, item) => sum + item.upkeep_balance, 0);

  const lowBalanceUpkeepers = activeUpkeepers.filter(
    item => item.estimated_actions_left < 10 && isFinite(item.estimated_actions_left),
  );

  const criticalBalanceUpkeepers = activeUpkeepers.filter(
    item => item.estimated_actions_left < 5 && isFinite(item.estimated_actions_left),
  );

  return (
    <Box p={2} maxW="container.lg" mx="auto">
      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading as="h2" size="lg" variant="special">
              Chainlink: Automation Catalog
            </Heading>
            <Text mt={2}>
              Status overview of operational Chainlink Upkeepers maintained by Balancer Maxis. These
              Upkeepers make sure that on-chain operations run such as veBAL fee injections and
              reward injector executions.
            </Text>
          </Box>

          {/* Summary Statistics */}
          <Box>
            <Heading as="h3" size="md" mb={4}>
              Summary
            </Heading>
            <HStack spacing={8} flexWrap="wrap">
              <Stat>
                <StatLabel>Active Upkeepers</StatLabel>
                <StatNumber>{activeUpkeepers.length}</StatNumber>
                <StatHelpText>of {chainlinkData.length} total</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Total Active Balance</StatLabel>
                <StatNumber>{totalActiveBalance.toFixed(2)} LINK</StatNumber>
                <StatHelpText>across all active upkeepers</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Low Balance Alert</StatLabel>
                <StatNumber color={lowBalanceUpkeepers.length > 0 ? "orange.500" : "green.500"}>
                  {lowBalanceUpkeepers.length}
                </StatNumber>
                <StatHelpText>&lt; 10 actions remaining</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Critical Balance Alert</StatLabel>
                <StatNumber color={criticalBalanceUpkeepers.length > 0 ? "red.500" : "green.500"}>
                  {criticalBalanceUpkeepers.length}
                </StatNumber>
                <StatHelpText>&lt; 5 actions remaining</StatHelpText>
              </Stat>
            </HStack>
          </Box>

          <Divider />

          {/* Active Upkeepers Table */}
          <Box>
            <Heading as="h3" size="md" mb={4}>
              Active Upkeepers ({activeUpkeepers.length})
            </Heading>
            <Text mb={4}>
              These upkeepers are currently operational and require monitoring for balance levels.
            </Text>
            {activeUpkeepers.length > 0 ? (
              <ChainlinkTable data={activeUpkeepers} />
            ) : (
              <Text color="orange.500" fontWeight="bold">
                ⚠️ No active upkeepers found!
              </Text>
            )}
          </Box>

          {/* Inactive Upkeepers Section */}
          {inactiveUpkeepers.length > 0 && (
            <Box>
              <Flex alignItems="center" mb={4}>
                <Heading as="h3" size="md" mr={4}>
                  Inactive Upkeepers ({inactiveUpkeepers.length})
                </Heading>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggle}
                  rightIcon={showInactive ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {showInactive ? "Hide" : "Show"} Records
                </Button>
              </Flex>

              <Collapse in={showInactive}>
                <Box>
                  <Text mb={4}>
                    Historical records of paused or cancelled upkeepers for auditing purposes.
                  </Text>
                  <ChainlinkTable data={inactiveUpkeepers} />
                </Box>
              </Collapse>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default ChainlinkAutomationPage;
