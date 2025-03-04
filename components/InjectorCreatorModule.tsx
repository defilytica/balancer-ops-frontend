"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  Grid,
  GridItem,
  Heading,
  NumberInput,
  NumberInputField,
  Text,
  Tooltip,
  useToast,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import { ethers } from "ethers";
import { NetworkSelector } from "@/components/NetworkSelector";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { getCategoryData, getSubCategoryData } from "@/lib/data/maxis/addressBook";
import { AddressBook } from "@/types/interfaces";
import { ChildChainGaugeInjectorV2Factory } from "@/abi/ChildChainGaugeInjectorV2Factory";
import AddressInput from "@/components/AdressInput";

interface InjectorCreationProps {
  addressBook: AddressBook;
}

export default function InjectorCreatorModule({ addressBook }: InjectorCreationProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [factoryAddress, setFactoryAddress] = useState("");
  const [keeperAddresses, setKeeperAddresses] = useState<string[]>([""]);
  const [minWaitPeriodSeconds, setMinWaitPeriodSeconds] = useState("518400"); // Default: 6 days
  const [injectTokenAddress, setInjectTokenAddress] = useState("");
  const [maxInjectionAmount, setMaxInjectionAmount] = useState("");
  const [owner, setOwner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [deployedInjectors, setDeployedInjectors] = useState<string[]>([]);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);

  const toast = useToast();

  // Get current network on component mount and when window.ethereum changes
  useEffect(() => {
    const checkChainId = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setCurrentChainId(network.chainId.toString());
        } catch (error) {
          console.error("Failed to get chain ID:", error);
          setCurrentChainId(null);
        }
      } else {
        setCurrentChainId(null);
      }
    };

    checkChainId();

    // Set up listener for chain changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        checkChainId();
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("chainChanged", checkChainId);
      }
    };
  }, []);

  // Fetch factory address for the selected network
  useEffect(() => {
    if (selectedNetwork) {
      const maxiKeepers = getCategoryData(addressBook, selectedNetwork.toLowerCase(), "maxiKeepers");
      console.log(maxiKeepers);
      if (maxiKeepers && maxiKeepers.injectorV2) {
        const factories = maxiKeepers.injectorV2;
        for (const [token, factoryAddress] of Object.entries(factories)) {
          console.log("token", token);
          console.log("factoryAddress", factoryAddress);
          if (token === "factory") {
            setFactoryAddress(factoryAddress.toString());
          }
        }
      }
    }
  }, [selectedNetwork, addressBook]);

  // Fetch deployed injectors for the selected network
  useEffect(() => {
    const fetchDeployedInjectors = async () => {
      if (!factoryAddress || !selectedNetwork) return;

      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const factoryContract = new ethers.Contract(
            factoryAddress,
            ChildChainGaugeInjectorV2Factory,
            provider
          );

          // This is a placeholder - the actual method call depends on what's available in your contract
          // const injectors = await factoryContract.getDeployedInjectors();
          // setDeployedInjectors(injectors);

          // For now, we'll just clear the array
          setDeployedInjectors([]);
        }
      } catch (error) {
        console.error("Failed to fetch deployed injectors:", error);
      }
    };

    fetchDeployedInjectors();
  }, [factoryAddress, selectedNetwork]);

  const handleNetworkChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setFactoryAddress("");
    setTransactionData(null);
  }, []);

  const handleAddKeeper = () => {
    setKeeperAddresses([...keeperAddresses, ""]);
  };

  const handleRemoveKeeper = (index: number) => {
    const updatedKeepers = [...keeperAddresses];
    updatedKeepers.splice(index, 1);
    setKeeperAddresses(updatedKeepers);
  };

  const handleKeeperChange = (index: number, value: string) => {
    const updatedKeepers = [...keeperAddresses];
    updatedKeepers[index] = value;
    setKeeperAddresses(updatedKeepers);
  };

  const validateInputs = (): string | null => {
    if (!factoryAddress) return "Factory address is required";
    if (!keeperAddresses.some(addr => addr.trim() !== "")) return "At least one keeper address is required";
    if (!minWaitPeriodSeconds) return "Minimum wait period is required";
    if (!injectTokenAddress) return "Inject token address is required";
    if (!owner) return "Owner address is required";

    // Validate addresses
    try {
      ethers.getAddress(injectTokenAddress); // This will throw if invalid
      ethers.getAddress(owner);

      // Validate keeper addresses that aren't empty
      keeperAddresses
        .filter(addr => addr.trim() !== "")
        .forEach(addr => ethers.getAddress(addr));
    } catch (error) {
      if (error instanceof Error) {
        return `Invalid address: ${error.message}`;
      }
      return "Invalid address";
    }

    return null;
  };

  const handleCreateInjector = async () => {
    const validationError = validateInputs();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Ethereum provider not available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const factoryContract = new ethers.Contract(
        factoryAddress,
        ChildChainGaugeInjectorV2Factory,
        signer
      );

      // Filter out empty keeper addresses
      const filteredKeepers = keeperAddresses.filter(addr => addr.trim() !== "");

      // Parse maxInjectionAmount
      const parsedMaxAmount = maxInjectionAmount
        ? ethers.parseUnits(maxInjectionAmount, 18)
        : BigInt(0);

      // Call contract method
      const tx = await factoryContract.createInjector(
        filteredKeepers,
        BigInt(minWaitPeriodSeconds || "0"),
        injectTokenAddress,
        parsedMaxAmount,
        owner
      );

      setTransactionData({
        hash: tx.hash,
        data: tx.data,
        from: tx.from,
        to: tx.to,
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      toast({
        title: "Injector Created",
        description: `Transaction hash: ${tx.hash}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Update the transaction data with receipt information
      setTransactionData({
        hash: tx.hash,
        data: tx.data,
        from: tx.from,
        to: tx.to,
        blockNumber: receipt?.blockNumber,
        confirmations: receipt?.confirmations,
        status: receipt?.status === 1 ? "Success" : "Failed",
      });

      // Refresh deployed injectors
      // Implement your refresh logic here

    } catch (error) {
      console.error("Transaction failed:", error);
      let errorMessage = "Transaction failed";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCorrectNetwork = currentChainId === NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork)?.chainId;

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        Create Injector
      </Heading>

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <NetworkSelector
            networks={networks}
            networkOptions={NETWORK_OPTIONS}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          {selectedNetwork && factoryAddress ? (
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text>Factory Address: {factoryAddress}</Text>
                {deployedInjectors.length > 0 && (
                  <Text mt={2}>Deployed Injectors: {deployedInjectors.length}</Text>
                )}
              </Box>
            </Alert>
          ) : selectedNetwork ? (
            <Alert status="warning">
              <AlertIcon />
              <AlertDescription>No injector factory found for this network.</AlertDescription>
            </Alert>
          ) : null}
        </GridItem>
      </Grid>

      {selectedNetwork && factoryAddress && (
        <>
          <Card mb={6}>
            <CardHeader>
              <Heading size="md">Injector Configuration</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Keepers Section */}
                <FormControl isRequired>
                  <Flex alignItems="center">
                    <FormLabel>Keeper Addresses</FormLabel>
                    <Tooltip label="List of addresses that can trigger injections. Include zero address to allow anyone to upkeep.">
                      <InfoIcon ml={1} />
                    </Tooltip>
                  </Flex>
                  {keeperAddresses.map((keeper, index) => (
                    <HStack key={index} mb={2}>
                      <AddressInput
                        value={keeper}
                        onChange={(e) => handleKeeperChange(index, e.target.value)}
                        placeholder="0x... (zero address for anyone)"
                      />
                      {index > 0 && (
                        <Button colorScheme="red" size="sm" onClick={() => handleRemoveKeeper(index)}>
                          Remove
                        </Button>
                      )}
                    </HStack>
                  ))}
                  <Button size="sm" onClick={handleAddKeeper} mt={2}>
                    Add Keeper
                  </Button>
                </FormControl>

                {/* Min Wait Period */}
                <FormControl isRequired>
                  <Flex alignItems="center">
                    <FormLabel>Min Wait Period (seconds)</FormLabel>
                    <Tooltip label="Minimum time between injections. Default is 6 days (518400 seconds).">
                      <InfoIcon ml={1} />
                    </Tooltip>
                  </Flex>
                  <NumberInput value={minWaitPeriodSeconds} onChange={setMinWaitPeriodSeconds} min={0}>
                    <NumberInputField placeholder="518400" />
                  </NumberInput>
                </FormControl>

                {/* Token Address */}
                <FormControl isRequired>
                  <Flex alignItems="center">
                    <FormLabel>Inject Token Address</FormLabel>
                    <Tooltip label="The token address that this injector will distribute. One injector per token.">
                      <InfoIcon ml={1} />
                    </Tooltip>
                  </Flex>
                  <AddressInput
                    value={injectTokenAddress}
                    onChange={(e) => setInjectTokenAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </FormControl>

                {/* Max Injection Amount */}
                <FormControl isRequired>
                  <Flex alignItems="center">
                    <FormLabel>Max Injection Amount</FormLabel>
                    <Tooltip label="Maximum amount of tokens that can be injected in a single transaction. Set to 0 for no limit.">
                      <InfoIcon ml={1} />
                    </Tooltip>
                  </Flex>
                  <NumberInput value={maxInjectionAmount} onChange={setMaxInjectionAmount} min={0}>
                    <NumberInputField placeholder="Enter max amount (0 for no limit)" />
                  </NumberInput>
                </FormControl>

                {/* Owner Address */}
                <FormControl isRequired>
                  <Flex alignItems="center">
                    <FormLabel>Owner Address</FormLabel>
                    <Tooltip label="The address that will own the injector. This address can add and remove schedules, and sweep tokens.">
                      <InfoIcon ml={1} />
                    </Tooltip>
                  </Flex>
                  <AddressInput
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="0x..."
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleCreateInjector}
            isLoading={isSubmitting}
            loadingText="Creating Injector..."
            isDisabled={!isCorrectNetwork || !factoryAddress}
            mb={6}
          >
            Create Injector
          </Button>

          {!isCorrectNetwork && selectedNetwork && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <AlertDescription>
                Please connect to the correct network in your wallet to continue.
              </AlertDescription>
            </Alert>
          )}

          {deployedInjectors.length > 0 && (
            <Card mb={6}>
              <CardHeader>
                <Heading size="md">Deployed Injectors</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  {deployedInjectors.map((injector, index) => (
                    <Flex key={index} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                      <Text>{injector}</Text>
                      <Badge colorScheme="green">Active</Badge>
                    </Flex>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {transactionData && (
            <Card>
              <CardHeader>
                <Heading size="md">Transaction Details</Heading>
              </CardHeader>
              <CardBody>
                <JsonViewerEditor
                  jsonData={JSON.stringify(transactionData, null, 2)}
                  onJsonChange={() => {}}
                />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}
