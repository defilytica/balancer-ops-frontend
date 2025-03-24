"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  List,
  ListItem,
  Select,
  Spinner,
  useToast,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Center,
  UnorderedList,
  OrderedList,
  HStack,
  Badge,
  InputGroup,
  InputRightElement,
  IconButton,
  Link,
} from "@chakra-ui/react";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import {
  GetPoolsDocument,
  GetPoolsQuery,
  GetPoolsQueryVariables,
  VeBalGetVotingGaugesDocument,
  VeBalGetVotingGaugesQuery,
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import {
  GAUGE_WEIGHT_CAPS,
  MAINNET_GAUGE_FACTORY,
  NETWORK_OPTIONS,
  networks,
} from "@/constants/constants";
import { CloseIcon, ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";
import { LiquidityGaugeFactory } from "@/abi/LiquidityGaugeFactory";
import { RootGaugeFactory } from "@/abi/RootGaugeFactory";
import { ChildGaugeFactory } from "@/abi/ChildGaugeFactory";
import { WeightCapType } from "@/types/types";
import { NetworkSelector } from "@/components/NetworkSelector";
import PoolSelector from "@/components/PoolSelector";

interface CreateGaugeProps {
  addressBook: AddressBook;
}

interface TransactionState {
  hash: string;
  status: "pending" | "success" | "error";
  type: "childGauge" | "rootGauge";
  address?: string;
}

interface PoolItem {
  name: string;
  address: string;
  id: string;
  staking?: {
    gauge?: {
      id: string;
    };
  };
}

const getContract = (address: string, abi: any, signer: ethers.Signer) => {
  return new ethers.Contract(address, abi, signer);
};

export default function CreateGaugeModule({ addressBook }: CreateGaugeProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [weightCap, setWeightCap] = useState<WeightCapType>(GAUGE_WEIGHT_CAPS.TWO_PERCENT);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toast = useToast();
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  //Chain state switch
  const { chains, switchChain } = useSwitchChain();

  //Pool data
  const { loading, error, data } = useQuery<GetPoolsQuery, GetPoolsQueryVariables>(
    GetPoolsDocument,
    {
      variables: { chainIn: [selectedNetwork as any] },
      skip: !selectedNetwork,
    },
  );

  const { data: votingGaugesData } = useQuery<VeBalGetVotingGaugesQuery>(
    VeBalGetVotingGaugesDocument,
  );

  const existingRootGauge = useMemo(() => {
    if (!selectedPool?.staking?.gauge?.id || !votingGaugesData?.veBalGetVotingList) {
      return null;
    }

    // Find matching root gauge for the selected child gauge
    return votingGaugesData.veBalGetVotingList.find(
      gauge =>
        gauge.gauge?.childGaugeAddress?.toLowerCase() ===
        selectedPool.staking?.gauge?.id.toLowerCase(),
    );
  }, [selectedPool, votingGaugesData]);

  // Function to get explorer URL based on network
  const getExplorerUrl = (network: string, hash: string, type?: "childGauge" | "rootGauge") => {
    // Always use mainnet explorer for root gauges
    if (type === "rootGauge") {
      return `${networks.mainnet.explorer}tx/${hash}`;
    }

    const networkKey = network.toLowerCase();
    const explorerBase = networks[networkKey]?.explorer || networks.mainnet.explorer;
    return `${explorerBase}tx/${hash}`;
  };

  const filteredPools = useMemo(() => {
    if (!data?.poolGetPools) return [];
    return data.poolGetPools.filter(
      pool =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.poolGetPools, searchTerm]);

  // Add condition to check for existing gauge
  const hasExistingGauge = useMemo(() => {
    return selectedPool?.staking?.gauge?.id != null;
  }, [selectedPool]);
  console.log("selectedPool", selectedPool);

  const handlePoolSelect = (pool: Pool) => {
    // Reset transaction and step state when selecting new pool
    setTransactions([]);
    setActiveStep(0);
    setSelectedPool(pool);
  };

  const clearPoolSelection = () => {
    setSelectedPool(null);
    setSearchTerm("");
  };

  const shouldSkipChildGauge = hasExistingGauge;
  useEffect(() => {
    if (shouldSkipChildGauge) {
      setActiveStep(1);
    }
  }, [shouldSkipChildGauge]);

  const getChildChainFactoryForNetwork = useCallback(
    (network: string) => {
      const childChainFactory =
        addressBook.active[network.toLowerCase()]?.["20230316-child-chain-gauge-factory-v2"]?.[
          "ChildChainGaugeFactory"
        ];
      if (typeof childChainFactory === "string") {
        return childChainFactory;
      } else if (childChainFactory && typeof childChainFactory === "object") {
        return Object.values(childChainFactory)[0] || "";
      }
      return "";
    },
    [addressBook],
  );

  const getRootGaugeFactoryForNetwork = useCallback(
    (network: string) => {
      // Convert network to the expected format (e.g., "POLYGON" -> "polygon")
      const normalizedNetwork = network.toLowerCase();

      // Find the correct factory key by matching the network
      const factoryKey = Object.keys(addressBook.active["mainnet"]).find(key =>
        key.toLowerCase().includes(`${normalizedNetwork}-root-gauge-factory`),
      );

      if (!factoryKey) {
        console.error(`No root gauge factory found for network: ${network}`);
        return "";
      }

      // Get the factory contract data
      const factoryData = addressBook.active["mainnet"][factoryKey];

      // Find the correct contract by looking for the *RootGaugeFactory name
      const factoryContract = Object.entries(factoryData).find(([key]) =>
        key.endsWith("RootGaugeFactory"),
      );

      if (!factoryContract || !factoryContract[1] || typeof factoryContract[1] !== "string") {
        console.error(`No valid root gauge factory address found in: ${factoryKey}`);
        return "";
      }

      // Ensure we're returning a string
      return factoryContract[1] as string;
    },
    [addressBook],
  );

  const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedPool(null);
    setTransactions([]);
    setActiveStep(0);

    // Find the corresponding chain ID for the selected network
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === newNetwork);
    if (networkOption) {
      try {
        switchChain({ chainId: Number(networkOption.chainId) });
      } catch (error) {
        toast({
          title: "Error switching network",
          description: "Please switch network manually in your wallet",
          status: "error",
          duration: 5000,
        });
      }
    }
  };

  const createMainnetGauge = async () => {
    if (!selectedPool || !address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(MAINNET_GAUGE_FACTORY, LiquidityGaugeFactory, signer);

      const tx = await contract.create(selectedPool.address, weightCap);

      setTransactions([
        {
          hash: tx.hash,
          status: "pending",
          type: "rootGauge",
        },
      ]);

      const receipt = await tx.wait();

      setTransactions(prev =>
        prev.map(t => (t.hash === tx.hash ? { ...t, status: "success" } : t)),
      );

      toast({
        title: "Mainnet gauge created successfully",
        description: "You can now create a governance proposal",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error creating gauge",
        description: "There was an error creating gauge, check transaction logs.",
        status: "error",
        duration: 5000,
      });
    }
  };

  const createChildChainGauge = async () => {
    if (!selectedPool || !address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const childFactory = getChildChainFactoryForNetwork(selectedNetwork);
      const contract = getContract(childFactory, ChildGaugeFactory, signer);

      const tx = await contract.create(selectedPool.address);

      setTransactions(prev => [
        ...prev,
        {
          hash: tx.hash,
          status: "pending",
          type: "childGauge",
        },
      ]);

      const receipt = await tx.wait();

      // Get deployed gauge address from events
      const gaugeCreatedEvent = receipt.logs
        .map((log: { topics: any; data: any }) => {
          try {
            return contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
          } catch {
            return null;
          }
        })
        .find((event: { name: string }) => event?.name === "GaugeCreated");

      const childGaugeAddress = gaugeCreatedEvent?.args?.gauge;

      setTransactions(prev =>
        prev.map(t =>
          t.hash === tx.hash ? { ...t, status: "success", address: childGaugeAddress } : t,
        ),
      );
      setActiveStep(1);

      toast({
        title: "Child chain gauge created",
        description: "Now switch to Ethereum mainnet to create root gauge",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error creating child chain gauge",
        description: "There was an error creating gauge, check transaction logs.",
        status: "error",
        duration: 5000,
      });
    }
  };

  const RootGaugeAlert = () => {
    if (!existingRootGauge) return null;

    return (
      <Alert status="warning" mt={4}>
        <AlertIcon />
        <AlertDescription>
          <Text fontWeight="bold" mb={2}>
            Existing Root Gauge Detected
          </Text>
          <Text>
            This gauge already has a root gauge on Ethereum ({existingRootGauge.gauge?.address}).
            {existingRootGauge.gauge?.isKilled && (
              <Text color="red.500" mt={2}>
                Note: This root gauge is marked as killed.
              </Text>
            )}
          </Text>
        </AlertDescription>
      </Alert>
    );
  };

  const createRootGauge = async () => {
    if (!selectedPool || !address) return;

    if (existingRootGauge?.gauge && !existingRootGauge.gauge.isKilled) {
      toast({
        title: "Root gauge already exists",
        description: "This child gauge already has an active root gauge on Ethereum.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    // Switch to mainnet for root gauge
    try {
      switchChain({ chainId: 1 });
    } catch (error) {
      toast({
        title: "Error switching network",
        description: "Please switch network manually in your wallet",
        status: "error",
        duration: 5000,
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const childGaugeAddress = hasExistingGauge
        ? selectedPool.staking?.gauge?.id
        : transactions.find(t => t.type === "childGauge")?.address;

      if (!childGaugeAddress) {
        throw new Error("Child gauge address not found");
      }

      const rootFactory = getRootGaugeFactoryForNetwork(selectedNetwork);
      if (!rootFactory) {
        throw new Error("Root gauge factory not found for network");
      }

      const contract = getContract(rootFactory, RootGaugeFactory, signer);
      const tx = await contract.create(childGaugeAddress, weightCap);

      // Add transaction to state immediately
      setTransactions(prev => [
        ...prev,
        {
          hash: tx.hash,
          status: "pending",
          type: "rootGauge",
        },
      ]);

      const receipt = await tx.wait();

      // More specific event parsing for root gauge creation
      const gaugeCreatedEvent = receipt.logs
        .map((log: { topics: any; data: any }) => {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            // Debug log to see what events we're getting
            console.log("Parsed event:", parsedLog);
            return parsedLog;
          } catch {
            return null;
          }
        })
        // Filter for non-null events and find the gauge creation event
        .filter(Boolean)
        .find(
          (event: { name: string }) =>
            // Check for both possible event names
            event?.name === "RootGaugeCreated" || event?.name === "GaugeCreated",
        );

      // Safely access the gauge address from event args
      const rootGaugeAddress =
        gaugeCreatedEvent?.args?.[0] || // First argument might be the gauge address
        gaugeCreatedEvent?.args?.gauge || // Named argument
        null; // Fallback if not found

      if (!rootGaugeAddress) {
        console.warn("Root gauge address not found in events:", receipt.logs);
      }

      // Update transaction with root gauge address if found
      setTransactions(prev =>
        prev.map(t =>
          t.hash === tx.hash
            ? {
                ...t,
                status: "success",
                address: rootGaugeAddress || undefined, // Only set if we found it
              }
            : t,
        ),
      );

      // Success toast
      toast({
        title: "Root gauge created successfully",
        description: rootGaugeAddress
          ? `Root gauge deployed at ${rootGaugeAddress}`
          : "Root gauge created successfully",
        status: "success",
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Root gauge creation error:", error);
      toast({
        title: "Error creating root gauge",
        description: error.message || "There was an error creating gauge, check transaction logs.",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Format pool display function
  const formatPoolDisplay = (pool: PoolItem) => {
    const hasGauge = pool.staking?.gauge?.id != null;
    return (
      <HStack justify="space-between" width="100%">
        <Text isTruncated maxW="60%">
          {pool.name}
        </Text>
        <HStack spacing={2}>
          {hasGauge && (
            <Badge colorScheme="blue" fontSize="xs">
              Has Gauge
            </Badge>
          )}
          <Text color="gray.500" fontSize="sm">
            {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
          </Text>
        </HStack>
      </HStack>
    );
  };

  return (
    <Container maxW="container.lg">
      {/* Header Section */}
      <Box mb={8}>
        <Heading as="h2" size="lg" variant="special" mb={4}>
          Balancer Staking Gauge Creator
        </Heading>
        <Text mb={4}>
          Easily create a staking gauge for a Balancer pool so it can receive BAL and/or secondary
          rewards on our platform.
        </Text>
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>
            <Text fontWeight="bold" mb={2}>
              Hints
            </Text>
            <UnorderedList spacing={2}>
              <ListItem>
                For a general FAQ on gauges and how incentives are managed, consult our{" "}
                <Link
                  href="https://docs.balancer.fi/partner-onboarding/onboarding-overview/incentive-management.html"
                  textDecoration="underline"
                  isExternal
                >
                  incentive management docs.
                </Link>
              </ListItem>
              <ListItem>
                For mainnet pools, only one transaction is needed to create the (root) gauge
              </ListItem>
              <ListItem>
                The "veBAL Vote Weight Cap" parameter needs to be set for root gauges only. It doesn't affect child chain gauges.
              </ListItem>
              <ListItem>
                For other networks, you will need to:
                <OrderedList ml={4} mt={1}>
                  <ListItem>Create a child chain gauge on the selected network</ListItem>
                  <ListItem>Create a root gauge on Ethereum mainnet</ListItem>
                </OrderedList>
              </ListItem>
              <ListItem>
                If you intend to apply for a veBAL gauge, consult{" "}
                <Link
                  href="https://forum.balancer.fi/t/instructions-overview/2674"
                  textDecoration="underline"
                  isExternal
                >
                  this documentation
                </Link>
              </ListItem>
            </UnorderedList>
          </AlertDescription>
        </Alert>

        {hasExistingGauge && (
          <Alert status="warning" mt={4}>
            <AlertIcon />
            <AlertDescription>
              <Text fontWeight="bold" mb={2}>
                Existing Gauge Detected
              </Text>
              <Text>
                This pool already has a gauge ({selectedPool?.staking?.gauge?.id}).
                {!existingRootGauge && " You can proceed to create a root gauge for it."}
              </Text>
            </AlertDescription>
          </Alert>
        )}
        {/* Add the root gauge alert */}
        <RootGaugeAlert />
      </Box>

      {/* Configuration Section */}
      <Box mb={8}>
        <Stack spacing={6}>
          {/* Network Selection */}
          <NetworkSelector
            networks={networks}
            networkOptions={NETWORK_OPTIONS}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />

          {/* Pool Selection */}
          {selectedNetwork && (
            <PoolSelector
              pools={data?.poolGetPools}
              loading={loading}
              error={error}
              selectedPool={selectedPool}
              onPoolSelect={(pool) => handlePoolSelect(pool as Pool)}
              onClearSelection={clearPoolSelection}
            />
          )}

          {/* Weight Cap Selection */}
          <FormControl>
            <FormLabel>
              veBAL Vote Weight Cap (Root Gauge)
              <Tooltip label="The vote weight cap determines the max. amount of veBAL votes a gauge may receive. 2% cap is recommended for most pools">
                <InfoIcon ml={2} cursor="help" />
              </Tooltip>
            </FormLabel>
            <RadioGroup value={weightCap} onChange={(value: WeightCapType) => setWeightCap(value)}>
              <Stack direction={["column", "row"]} wrap="wrap" spacing={4}>
                <Radio value={GAUGE_WEIGHT_CAPS.TWO_PERCENT}>2% Cap (Recommended)</Radio>
                <Radio value={GAUGE_WEIGHT_CAPS.FIVE_PERCENT}>5% Cap</Radio>
                <Radio value={GAUGE_WEIGHT_CAPS.TEN_PERCENT}>10% Cap</Radio>
                <Radio value={GAUGE_WEIGHT_CAPS.UNCAPPED}>Uncapped</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </Stack>
      </Box>

      {/* Action Section */}
      {selectedNetwork && selectedPool && (
        <Card mb={8}>
          <CardHeader>
            <Heading size="md">Gauge Creation Steps</Heading>
          </CardHeader>
          <CardBody>
            {selectedNetwork === "MAINNET" ? (
              <Button
                variant="primary"
                size="lg"
                onClick={createMainnetGauge}
                isDisabled={!address || hasExistingGauge}
                width="full"
              >
                {hasExistingGauge ? "Gauge Already Exists" : "Create Mainnet Gauge"}
              </Button>
            ) : (
              <Stepper index={activeStep}>
                <Step>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber>1</StepNumber>}
                      active={<StepNumber>1</StepNumber>}
                    />
                  </StepIndicator>
                  <Box flexShrink="0">
                    <StepTitle>Create Child Chain Gauge</StepTitle>
                    <StepDescription>On {selectedNetwork}</StepDescription>
                    {!shouldSkipChildGauge && (
                      <Button
                        mt={2}
                        variant="primary"
                        onClick={createChildChainGauge}
                        isDisabled={!address || activeStep > 0}
                      >
                        Create Child Gauge
                      </Button>
                    )}
                    {shouldSkipChildGauge && (
                      <Text color="green.500" mt={2}>
                        Using existing gauge
                      </Text>
                    )}
                  </Box>
                  <StepSeparator />
                </Step>
                <Step>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber>2</StepNumber>}
                      active={<StepNumber>2</StepNumber>}
                    />
                  </StepIndicator>
                  <Box flexShrink="0">
                    <StepTitle>Create Root Gauge</StepTitle>
                    <StepDescription>On Ethereum Mainnet</StepDescription>
                    <Button
                      mt={2}
                      variant="primary"
                      onClick={createRootGauge}
                      isDisabled={
                        !address ||
                        activeStep !== 1 ||
                        (existingRootGauge?.gauge && !existingRootGauge.gauge.isKilled)
                      }
                    >
                      {existingRootGauge?.gauge && !existingRootGauge.gauge.isKilled
                        ? "Root Gauge Exists"
                        : "Create Root Gauge"}
                    </Button>
                  </Box>
                </Step>
              </Stepper>
            )}
          </CardBody>
        </Card>
      )}

      {/* Transaction History Section */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <Heading size="md">Transaction History</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              {transactions.map((tx, index) => (
                <Flex key={index} align="center" justify="space-between">
                  <HStack spacing={2}>
                    <Text fontSize="medium">
                      {tx.type === "childGauge" ? "Child Gauge" : "Root Gauge"}:
                    </Text>
                    {tx.address && <Text fontWeight="medium">{tx.address}</Text>}
                  </HStack>
                  <HStack spacing={4}>
                    <Button
                      as="a"
                      href={getExplorerUrl(selectedNetwork, tx.hash, tx.type)}
                      target="_blank"
                      variant="link"
                      rightIcon={<ExternalLinkIcon />}
                      size="sm"
                    >
                      {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                    </Button>

                    <Badge colorScheme={tx.status === "success" ? "green" : "orange"}>
                      {tx.status}
                    </Badge>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
