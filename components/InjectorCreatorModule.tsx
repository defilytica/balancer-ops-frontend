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
  Link,
  Spinner, Center, Table, Th, Tbody, Td, Thead, Tr,
} from "@chakra-ui/react";
import { InfoIcon, ExternalLinkIcon, CheckCircleIcon, CopyIcon } from "@chakra-ui/icons";
import { ethers } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import { NetworkSelector } from "@/components/NetworkSelector";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import { AddressBook } from "@/types/interfaces";
import { ChildChainGaugeInjectorV2Factory } from "@/abi/ChildChainGaugeInjectorV2Factory";
import AddressInput from "@/components/AdressInput";
import axios from "axios";

// ERC20 Token ABI (minimal for name, symbol and decimals)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

interface InjectorCreationProps {
  addressBook: AddressBook;
}

interface TransactionState {
  hash: string;
  status: "pending" | "success" | "error";
  address?: string;
}

// Add these interface definitions
interface InjectorInfo {
  address: string;
  token: string;
}

interface NetworkInjectorResponse {
  factory: string | null;
  injectors: InjectorInfo[];
}

export default function InjectorCreatorModule({ addressBook }: InjectorCreationProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [factoryAddress, setFactoryAddress] = useState("");
  const [keeperAddresses, setKeeperAddresses] = useState<string[]>(["0x0000000000000000000000000000000000000000"]);
  const [minWaitPeriodSeconds, setMinWaitPeriodSeconds] = useState("518400"); // Default: 6 days
  const [injectTokenAddress, setInjectTokenAddress] = useState("");
  const [tokenInfo, setTokenInfo] = useState<{name: string; symbol: string; decimals: number} | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [maxInjectionAmount, setMaxInjectionAmount] = useState("0");
  const [owner, setOwner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  const [deployedInjectors, setDeployedInjectors] = useState<string[]>([]);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);
  const [existingInjectors, setExistingInjectors] = useState<InjectorInfo[]>([]);
  const [existingInjectorForToken, setExistingInjectorForToken] = useState<string | null>(null);
  const [isLoadingInjectors, setIsLoadingInjectors] = useState(false);

  const toast = useToast();
  const { address } = useAccount();
  const { chains, switchChain } = useSwitchChain();

  // Get current network on component mount and when window.ethereum changes
  useEffect(() => {
    const checkChainId = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setCurrentChainId(network.chainId.toString());

          // Auto-select network based on connected chain
          const matchingNetwork = NETWORK_OPTIONS.find(
            n => n.chainId === network.chainId.toString()
          );
          if (matchingNetwork && selectedNetwork === "") {
            setSelectedNetwork(matchingNetwork.apiID);
          }
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

    // Check if we're in development mode
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      setIsDev(true);
    } else if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      setIsDev(true);
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("chainChanged", checkChainId);
      }
    };
  }, [selectedNetwork]);

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

  // Fetch token info when token address changes
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!injectTokenAddress || !ethers.isAddress(injectTokenAddress) || !selectedNetwork) {
        setTokenInfo(null);
        setTokenError(null);
        return;
      }

      setIsLoadingToken(true);
      setTokenError(null);

      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const tokenContract = new ethers.Contract(
            injectTokenAddress,
            ERC20_ABI,
            provider
          );

          // Fetch token details
          const [name, symbol, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);

          setTokenInfo({
            name,
            symbol,
            decimals: Number(decimals)
          });
        }
      } catch (error) {
        console.error("Failed to fetch token info:", error);
        setTokenError("Failed to fetch token information. Please verify this is a valid ERC-20 token address.");
        setTokenInfo(null);
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchTokenInfo();
  }, [injectTokenAddress, selectedNetwork]);

  // Fetch deployed injectors for network
  useEffect(() => {
    const fetchNetworkInjectors = async () => {
      if (!selectedNetwork) {
        setExistingInjectors([]);
        setDeployedInjectors([]);
        setFactoryAddress("");
        return;
      }

      setIsLoadingInjectors(true);

      try {
        const response = await axios.get<NetworkInjectorResponse>(
          `/api/injector/v2/network?network=${selectedNetwork.toLowerCase()}`
        );

        if (response.data.factory) {
          setFactoryAddress(response.data.factory);
        } else {
          setFactoryAddress("");
        }

        if (response.data.injectors && Array.isArray(response.data.injectors)) {
          // Set existing injectors with tokens
          setExistingInjectors(response.data.injectors);

          // Also update deployedInjectors for backward compatibility
          setDeployedInjectors(response.data.injectors.map(inj => inj.address));
        } else {
          setExistingInjectors([]);
          setDeployedInjectors([]);
        }
      } catch (error) {
        console.error("Failed to fetch injectors for network:", error);
        toast({
          title: "Error fetching injectors",
          description: "Could not load existing injectors for this network.",
          status: "error",
          duration: 5000,
        });
        setExistingInjectors([]);
        setDeployedInjectors([]);
      } finally {
        setIsLoadingInjectors(false);
      }
    };

    fetchNetworkInjectors();
  }, [selectedNetwork, toast]);

  useEffect(() => {
    const checkExistingInjector = () => {
      if (!injectTokenAddress || !ethers.isAddress(injectTokenAddress)) {
        setExistingInjectorForToken(null);
        return;
      }

      // Skip check if no injectors are loaded yet
      if (!existingInjectors || existingInjectors.length === 0) {
        setExistingInjectorForToken(null);
        return;
      }

      console.log("Checking for existing injector with token:", injectTokenAddress);
      console.log("Available injectors:", existingInjectors);

      // Normalize the token address for case-insensitive comparison
      const normalizedTokenAddress = injectTokenAddress.toLowerCase();

      // Find any injector that uses this token
      const matchingInjector = existingInjectors.find(
        inj => inj.token && inj.token.toLowerCase() === normalizedTokenAddress
      );

      console.log("Matching injector found:", matchingInjector);

      if (matchingInjector) {
        setExistingInjectorForToken(matchingInjector.address);
      } else {
        setExistingInjectorForToken(null);
      }
    };

    checkExistingInjector();
  }, [injectTokenAddress, existingInjectors]);

  // TODO: remove Fetch deployed injectors for the selected network
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

          // For now, we'll just clear the array
          setDeployedInjectors([]);
        }
      } catch (error) {
        console.error("Failed to fetch deployed injectors:", error);
      }
    };

    fetchDeployedInjectors();
  }, [factoryAddress, selectedNetwork]);

  const handleNetworkChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setFactoryAddress("");
    setTransactions([]);

    // Find the corresponding chain ID for the selected network
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === newNetwork);
    if (networkOption) {
      try {
        await switchChain({ chainId: Number(networkOption.chainId) });
      } catch (error) {
        toast({
          title: "Error switching network",
          description: "Please switch network manually in your wallet",
          status: "error",
          duration: 5000,
        });
      }
    }
  }, [switchChain, toast]);

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

  // Function to get explorer URL based on network
  const getExplorerUrl = (network: string, hash: string) => {
    const networkKey = network.toLowerCase();
    const explorerBase = networks[networkKey]?.explorer || networks.mainnet.explorer;
    return `${explorerBase}tx/${hash}`;
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

      // Add transaction to state
      setTransactions([
        {
          hash: tx.hash,
          status: "pending"
        }
      ]);

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get deployed injector address from events
      const injectorCreatedEvent = receipt.logs
        .map((log: { topics: any; data: any }) => {
          try {
            return factoryContract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
          } catch {
            return null;
          }
        })
        .find((event: { name: string }) => event?.name === "InjectorCreated");

      const injectorAddress = injectorCreatedEvent?.args?.injector;

      // Update transaction state with success and address
      setTransactions(prev =>
        prev.map(t =>
          t.hash === tx.hash
            ? {
              ...t,
              status: "success",
              address: injectorAddress
            }
            : t
        )
      );

      toast({
        title: "Injector Created",
        description: `Injector created successfully at ${injectorAddress}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Add the new injector to the list of deployed injectors
      if (injectorAddress) {
        setDeployedInjectors([...deployedInjectors, injectorAddress]);
      }

    } catch (error) {
      console.error("Transaction failed:", error);
      let errorMessage = "Transaction failed";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setTransactions(prev =>
        prev.map(t =>
          t.hash === prev[0]?.hash
            ? { ...t, status: "error" }
            : t
        )
      );

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

  // Function to simulate a successful transaction (dev only)
  const simulateSuccessfulTransaction = () => {
    // Mock transaction hash (random)
    const mockTxHash = `0x${Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Mock injector address
    const mockInjectorAddress = `0x${Array.from({length: 40}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // First add pending transaction
    setTransactions([
      {
        hash: mockTxHash,
        status: "pending"
      }
    ]);

    // After 2 seconds, update to success with address
    setTimeout(() => {
      setTransactions(prev =>
        prev.map(tx =>
          tx.hash === mockTxHash
            ? { ...tx, status: "success", address: mockInjectorAddress }
            : tx
        )
      );

      // Add to deployed injectors
      setDeployedInjectors(prev => [...prev, mockInjectorAddress]);

      toast({
        title: "Simulated Success",
        description: `Mock injector created at ${mockInjectorAddress}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }, 2000);
  };

  // Function to simulate token verification (dev only)
  const simulateTokenVerification = () => {
    if (!injectTokenAddress || !ethers.isAddress(injectTokenAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid address first",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoadingToken(true);
    setTokenError(null);
    setTokenInfo(null);

    // Simulate loading delay
    setTimeout(() => {
      setIsLoadingToken(false);
      // Randomly simulate either success or error
      if (Math.random() > 0.3) {
        setTokenInfo({
          name: "Mock Token",
          symbol: "MOCK",
          decimals: 18
        });
      } else {
        setTokenError("Failed to fetch token information. Please verify this is a valid ERC-20 token address.");
      }
    }, 1500);
  };

  const ExistingInjectorWarning = () => {
    console.log("Existing injector for token:", existingInjectorForToken);

    if (!existingInjectorForToken) {
      return null;
    }

    return (
      <Alert status="warning" mt={2} size="sm">
        <AlertIcon />
        <Box>
          <AlertDescription fontSize="sm" fontWeight="medium">
            An injector for this token already exists!
          </AlertDescription>
          <HStack mt={1}>
            <Text fontSize="sm">Address: {existingInjectorForToken}</Text>
            {selectedNetwork && (
              <Link
                href={`${networks[selectedNetwork.toLowerCase()]?.explorer}address/${existingInjectorForToken}`}
                isExternal
                color="blue.600"
                fontSize="sm"
                display="flex"
                alignItems="center"
              >
                View <ExternalLinkIcon mx={1} />
              </Link>
            )}
          </HStack>
          <Text fontSize="xs" mt={1}>
            Only create a new injector for the same token if it is really needed!
          </Text>
        </Box>
      </Alert>
    );
  };

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={2}>
        Deploy a Token Rewards Injector (v2)
      </Heading>
      <Box mb={6}>
      <Text>
        Use this interface to deploy a token rewards injector that can schedule token emissions on Balancer staking gauges
      </Text>
      </Box>

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
                        placeholder="0x0000000000000000000000000000000000000000 (zero address for anyone)"
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

                  {isLoadingToken && (
                    <Flex mt={2}>
                      <Spinner size="sm" mr={2} />
                      <Text fontSize="sm">Verifying token...</Text>
                    </Flex>
                  )}

                  {tokenError && (
                    <Alert status="error" mt={2} size="sm">
                      <AlertIcon />
                      <AlertDescription fontSize="sm">{tokenError}</AlertDescription>
                    </Alert>
                  )}

                  {tokenInfo && (
                    <Box mt={2} p={2} borderWidth="1px" borderRadius="md" bgColor="gray.500">
                      <Flex alignItems="center">
                        <CheckCircleIcon color="green.500" mr={2} />
                        <Text fontWeight="medium">
                          {tokenInfo.name} ({tokenInfo.symbol})
                        </Text>
                        {selectedNetwork && (
                          <Link
                            href={`${networks[selectedNetwork.toLowerCase()]?.explorer}token/${injectTokenAddress}`}
                            isExternal
                            ml={2}
                            color="gray.800"
                            fontSize="sm"
                            display="flex"
                            alignItems="center"
                          >
                            Verify <ExternalLinkIcon mx={1} />
                          </Link>
                        )}
                      </Flex>
                      <Text fontSize="xs" color="gray.800" mt={1}>
                        Decimals: {tokenInfo.decimals}
                      </Text>
                    </Box>
                  )}
                  <ExistingInjectorWarning />
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

          <HStack spacing={4} mb={6}>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleCreateInjector}
              isLoading={isSubmitting}
              loadingText="Creating Injector..."
              isDisabled={!isCorrectNetwork || !factoryAddress}
            >
              Create Injector
            </Button>

            {isDev && (
              <VStack align="start" spacing={2} mt={2}>
                <Button
                  colorScheme="purple"
                  size="lg"
                  onClick={simulateSuccessfulTransaction}
                  leftIcon={<span role="img" aria-label="development">🧪</span>}
                >
                  Simulate Success (Dev Only)
                </Button>
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={simulateTokenVerification}
                  leftIcon={<span role="img" aria-label="token">🪙</span>}
                >
                  Simulate Token Verification
                </Button>
              </VStack>
            )}
          </HStack>

          {!isCorrectNetwork && selectedNetwork && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box>
                <AlertDescription>
                  Please connect to the correct network in your wallet to continue.
                </AlertDescription>
                <Button
                  mt={2}
                  size="sm"
                  colorScheme="blue"
                  onClick={() => {
                    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
                    if (networkOption) {
                      switchChain({ chainId: Number(networkOption.chainId) });
                    }
                  }}
                >
                  Switch to {selectedNetwork}
                </Button>
              </Box>
            </Alert>
          )}

          {/* Transaction History Section */}
          {transactions.length > 0 && (
            <Card mb={6}>
              <CardHeader>
                <Heading size="md">Transaction History</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {transactions.map((tx, index) => (
                    <Flex key={index} align="center" justify="space-between">
                      <HStack spacing={2}>
                        <Text fontSize="medium">Injector:</Text>
                        {tx.address && <Text fontWeight="medium">{tx.address}</Text>}
                      </HStack>
                      <HStack spacing={4}>
                        <Button
                          as="a"
                          href={getExplorerUrl(selectedNetwork, tx.hash)}
                          target="_blank"
                          variant="link"
                          rightIcon={<ExternalLinkIcon />}
                          size="sm"
                        >
                          {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                        </Button>
                        <Badge colorScheme={
                          tx.status === "success" ? "green" :
                            tx.status === "pending" ? "orange" : "red"
                        }>
                          {tx.status}
                        </Badge>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {deployedInjectors.length > 0 && (
            <Card mb={6}>
              <CardHeader>
                <Heading size="md">Deployed Injectors</Heading>
              </CardHeader>
              <CardBody>
                {isLoadingInjectors ? (
                  <Center py={4}>
                    <Spinner mr={2} />
                    <Text>Loading injectors...</Text>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Address</Th>
                          <Th>Reward Token</Th>
                          <Th textAlign="right">Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {existingInjectors.map((injector, index) => (
                          <Tr key={index}>
                            <Td>
                              <HStack spacing={1}>
                                <Text fontSize="sm" fontFamily="mono">
                                  {injector.address.substring(0, 8)}...{injector.address.substring(injector.address.length - 6)}
                                </Text>
                                <Link
                                  href={`${networks[selectedNetwork.toLowerCase()]?.explorer}address/${injector.address}`}
                                  isExternal
                                  color="blue.600"
                                  fontSize="sm"
                                >
                                  <ExternalLinkIcon />
                                </Link>
                                <Tooltip label="Copy address">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => {
                                      navigator.clipboard.writeText(injector.address);
                                      toast({
                                        title: "Address copied",
                                        status: "success",
                                        duration: 2000,
                                        isClosable: true,
                                      });
                                    }}
                                  >
                                    <CopyIcon />
                                  </Button>
                                </Tooltip>
                              </HStack>
                            </Td>
                            <Td>
                              {injector.token ? (
                                <HStack spacing={1}>
                                  <Text fontSize="sm" fontFamily="mono">
                                    {injector.token.substring(0, 8)}...{injector.token.substring(injector.token.length - 6)}
                                  </Text>
                                  <Link
                                    href={`${networks[selectedNetwork.toLowerCase()]?.explorer}token/${injector.token}`}
                                    isExternal
                                    color="blue.600"
                                    fontSize="sm"
                                  >
                                    <ExternalLinkIcon />
                                  </Link>
                                  <Tooltip label="Copy token address">
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      onClick={() => {
                                        navigator.clipboard.writeText(injector.token);
                                        toast({
                                          title: "Token address copied",
                                          status: "success",
                                          duration: 2000,
                                          isClosable: true,
                                        });
                                      }}
                                    >
                                      <CopyIcon />
                                    </Button>
                                  </Tooltip>
                                </HStack>
                              ) : (
                                <Text color="gray.500" fontSize="sm">Unknown</Text>
                              )}
                            </Td>
                            <Td textAlign="right">
                              <Badge colorScheme="green" ml="auto">Active</Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}
