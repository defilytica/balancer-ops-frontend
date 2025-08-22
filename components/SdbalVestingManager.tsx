"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Heading,
  HStack,
  Select,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import { useQuery } from "@apollo/client";
import { AddressBook } from "@/types/interfaces";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import { sdBALVesterABI } from "@/abi/sdBALVester";
import { gaugeABI } from "@/abi/gauge";
import { CurrentTokenPricesDocument, GqlChain } from "@/lib/services/apollo/generated/graphql";

interface SdbalVestingManagerProps {
  addressBook: AddressBook;
}

interface VestingContract {
  name: string;
  address: string;
}

interface MerklData {
  [address: string]: {
    index: number;
    amount: {
      type: string;
      hex: string;
    };
    proof: string[];
  };
}

export default function SdbalVestingManager({ addressBook }: SdbalVestingManagerProps) {
  const [selectedContract, setSelectedContract] = useState<VestingContract | null>(null);
  const [merklData, setMerklData] = useState<MerklData | null>(null);
  const [isLoadingMerkl, setIsLoadingMerkl] = useState(false);

  const { address: connectedAddress, chainId } = useAccount();
  const toast = useToast();
  const { writeContractAsync } = useWriteContract();
  const { switchChain } = useSwitchChain();

  const MAINNET_CHAIN_ID = 1;
  const isOnMainnet = chainId === MAINNET_CHAIN_ID;
  const sdBALTokenAddress = "0xF24d8651578a55b0C119B9910759a351A3458895";

  // Fetch sdBAL token price
  const { data: priceData } = useQuery(CurrentTokenPricesDocument, {
    variables: { chains: ["MAINNET" as GqlChain] },
    context: {
      uri: "https://api-v3.balancer.fi/",
    },
  });

  const sdBALPrice = useMemo(() => {
    if (!priceData?.tokenGetCurrentPrices) return null;
    const price = priceData.tokenGetCurrentPrices.find(
      p => p.address.toLowerCase() === sdBALTokenAddress.toLowerCase(),
    );
    return price?.price || null;
  }, [priceData?.tokenGetCurrentPrices]);

  // Calculate claimable amounts
  const claimableVotingRewards = useMemo(() => {
    if (!selectedContract || !merklData) return null;
    const vesterAddress = selectedContract.address.toLowerCase();
    const data = merklData[vesterAddress];
    if (!data) return null;

    const amountHex = typeof data.amount === "object" ? data.amount.hex : data.amount;
    const amount = BigInt(amountHex);
    const formatted = (Number(amount) / 1e18).toString(); // sdBAL has 18 decimals
    return {
      amount: formatted,
      usdValue: sdBALPrice ? (parseFloat(formatted) * sdBALPrice).toFixed(2) : null,
    };
  }, [selectedContract, merklData, sdBALPrice]);

  // Read the gauge address from the selected contract
  const { data: gaugeAddress } = useReadContract({
    address: selectedContract?.address as `0x${string}`,
    abi: sdBALVesterABI,
    functionName: "SD_TOKEN_GAUGE",
    query: {
      enabled: !!selectedContract?.address && isOnMainnet,
    },
  });

  // Token addresses for rewards
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC mainnet
  const BAL_ADDRESS = "0xba100000625a3754423978a60c9317c58a424e3D"; // BAL mainnet

  // Read claimable USDC from gauge
  const { data: claimableUSDC } = useReadContract({
    address: gaugeAddress as `0x${string}`,
    abi: gaugeABI,
    functionName: "claimable_reward",
    args: [selectedContract?.address as `0x${string}`, USDC_ADDRESS as `0x${string}`],
    query: {
      enabled: !!gaugeAddress && !!selectedContract?.address && isOnMainnet,
    },
  });

  // Read claimable BAL from gauge
  const { data: claimableBAL } = useReadContract({
    address: gaugeAddress as `0x${string}`,
    abi: gaugeABI,
    functionName: "claimable_reward",
    args: [selectedContract?.address as `0x${string}`, BAL_ADDRESS as `0x${string}`],
    query: {
      enabled: !!gaugeAddress && !!selectedContract?.address && isOnMainnet,
    },
  });

  // Get token prices for USDC and BAL
  const usdcPrice = useMemo(() => {
    if (!priceData?.tokenGetCurrentPrices) return 1; // USDC is ~$1
    const price = priceData.tokenGetCurrentPrices.find(
      p => p.address.toLowerCase() === USDC_ADDRESS.toLowerCase(),
    );
    return price?.price || 1;
  }, [priceData?.tokenGetCurrentPrices]);

  const balPrice = useMemo(() => {
    if (!priceData?.tokenGetCurrentPrices) return null;
    const price = priceData.tokenGetCurrentPrices.find(
      p => p.address.toLowerCase() === BAL_ADDRESS.toLowerCase(),
    );
    return price?.price || null;
  }, [priceData?.tokenGetCurrentPrices]);

  // Calculate vesting rewards amounts
  const vestingRewards = useMemo(() => {
    const rewards = [];

    if (claimableUSDC && BigInt(claimableUSDC.toString()) > BigInt(0)) {
      const usdcAmount = (Number(claimableUSDC) / 1e6).toString(); // USDC has 6 decimals
      rewards.push({
        symbol: "USDC",
        amount: usdcAmount,
        usdValue: (parseFloat(usdcAmount) * usdcPrice).toFixed(2),
      });
    }

    if (claimableBAL && BigInt(claimableBAL.toString()) > BigInt(0)) {
      const balAmount = (Number(claimableBAL) / 1e18).toString(); // BAL has 18 decimals
      rewards.push({
        symbol: "BAL",
        amount: balAmount,
        usdValue: balPrice ? (parseFloat(balAmount) * balPrice).toFixed(2) : null,
      });
    }

    return rewards;
  }, [claimableUSDC, claimableBAL, usdcPrice, balPrice]);

  // Get all stake_dao vesting contracts from the address book
  const vestingContracts = useMemo(() => {
    const contracts: VestingContract[] = [];

    // Get networks that have stake_dao category
    Object.keys(addressBook.active).forEach(network => {
      const stakeDAOData = getCategoryData(addressBook, network, "stake_dao");
      if (stakeDAOData) {
        Object.entries(stakeDAOData).forEach(([name, address]) => {
          if (name.includes("Vester") && typeof address === "string") {
            contracts.push({
              name: `${name} (${network})`,
              address,
            });
          }
        });
      }
    });

    return contracts;
  }, [addressBook]);

  // Check if connected wallet is beneficiary of selected contract
  const { data: beneficiary, isLoading: isLoadingBeneficiary } = useReadContract({
    address: selectedContract?.address as `0x${string}`,
    abi: sdBALVesterABI,
    functionName: "beneficiary",
    query: {
      enabled: !!selectedContract?.address && isOnMainnet,
    },
  });

  const isBeneficiary = useMemo(() => {
    if (!connectedAddress || !beneficiary) {
      return false;
    }

    const connected = connectedAddress.toLowerCase();
    const beneficiaryAddr = String(beneficiary).toLowerCase();

    console.log("Beneficiary check:", {
      connected,
      beneficiaryAddr,
      match: connected === beneficiaryAddr,
    });

    return connected === beneficiaryAddr;
  }, [connectedAddress, beneficiary]);

  // Fetch Merkl proofs data from API route
  useEffect(() => {
    const fetchMerklData = async () => {
      setIsLoadingMerkl(true);
      try {
        const response = await fetch("/api/merkl");

        if (!response.ok) {
          throw new Error("Failed to fetch Merkl data");
        }

        const apiResponse = await response.json();

        if (apiResponse.error) {
          throw new Error(apiResponse.details || apiResponse.error);
        }

        // Ensure all addresses in merkl data are lowercase
        const normalizedData: MerklData = {};
        Object.entries(apiResponse.data as MerklData).forEach(([address, data]) => {
          normalizedData[address.toLowerCase()] = data as MerklData[string];
        });

        setMerklData(normalizedData);
        console.log(`Merkl data loaded: ${Object.keys(normalizedData).length} addresses`);
        console.log(`Data timestamp: ${apiResponse.timestamp}`);
        console.log(`Next update: ${apiResponse.nextUpdate}`);

        // Log first 5 addresses for debugging
        const sampleAddresses = Object.keys(normalizedData).slice(0, 5);
        console.log("Sample addresses in merkl data:", sampleAddresses);
      } catch (error) {
        console.error("Error fetching Merkl data:", error);
        toast({
          title: "Error fetching Merkl data",
          description: "Could not load voting rewards data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingMerkl(false);
      }
    };

    fetchMerklData();
  }, [toast]);

  const handleSwitchToMainnet = useCallback(async () => {
    try {
      await switchChain({ chainId: MAINNET_CHAIN_ID });
    } catch (error: any) {
      console.error("Error switching to mainnet:", error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch to mainnet",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [switchChain, toast]);

  const handleContractSelect = useCallback(
    (contractAddress: string) => {
      const contract = vestingContracts.find(c => c.address === contractAddress);
      setSelectedContract(contract || null);
    },
    [vestingContracts],
  );

  const handleClaimRewards = useCallback(async () => {
    if (!selectedContract || !connectedAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet and select a vesting contract",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isOnMainnet) {
      toast({
        title: "Wrong network",
        description: "Please switch to Ethereum Mainnet to claim rewards",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isBeneficiary) {
      toast({
        title: "Not authorized",
        description: "You are not the beneficiary of this vesting contract",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: selectedContract.address as `0x${string}`,
        abi: sdBALVesterABI,
        functionName: "claimRewards",
        args: [],
      });

      toast({
        title: "Transaction submitted",
        description: `Claiming rewards. Transaction: ${hash}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to claim rewards",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [selectedContract, connectedAddress, isOnMainnet, isBeneficiary, writeContractAsync, toast]);

  const handleClaimVotingRewards = useCallback(async () => {
    if (!selectedContract || !connectedAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet and select a vesting contract",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isOnMainnet) {
      toast({
        title: "Wrong network",
        description: "Please switch to Ethereum Mainnet to claim voting rewards",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isBeneficiary) {
      toast({
        title: "Not authorized",
        description: "You are not the beneficiary of this vesting contract",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!merklData) {
      toast({
        title: "Merkl data not loaded",
        description: "Voting rewards data is not available",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Static values for sdBAL voting rewards
    const sdBALTokenAddress = "0xF24d8651578a55b0C119B9910759a351A3458895"; // sdBAL token address

    // Use the vesting contract address for merkl data lookup
    const vesterAddress = selectedContract.address.toLowerCase();
    const finalData = merklData[vesterAddress];

    console.log("=== Merkl Address Lookup ===");
    console.log("Vesting contract address (original):", selectedContract.address);
    console.log("Vesting contract address (lowercase):", vesterAddress);
    console.log("Connected wallet:", connectedAddress);
    console.log("Data found:", !!finalData);

    if (!finalData) {
      console.log("No voting rewards found for vesting contract:", vesterAddress);
      console.log("Total addresses in merkl data:", Object.keys(merklData).length);

      toast({
        title: "No voting rewards found",
        description: "No voting rewards available for this vesting contract in the current period",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const finalDataToUse = finalData;

    console.log("Found merkl data:", finalDataToUse);

    try {
      // Extract values from merkl data
      const index = Number(finalDataToUse.index);
      const amountHex =
        typeof finalDataToUse.amount === "object"
          ? finalDataToUse.amount.hex
          : finalDataToUse.amount;
      const amount = BigInt(amountHex);

      // Proofs are already in correct format from API
      const proofs = finalDataToUse.proof as `0x${string}`[];

      console.log("Claiming voting rewards with params:", {
        token: sdBALTokenAddress,
        index,
        amount: amount.toString(),
        amountHex,
        proofs: proofs.length + " proofs",
        firstProof: proofs[0],
        vesterAddress,
        beneficiary: connectedAddress,
      });

      const hash = await writeContractAsync({
        address: selectedContract.address as `0x${string}`,
        abi: sdBALVesterABI,
        functionName: "claimVotingRewards",
        args: [
          sdBALTokenAddress, // token address as string
          index, // index as number
          amount, // amount as BigInt
          proofs, // merkle proofs already formatted
        ],
      });

      toast({
        title: "Transaction submitted",
        description: `Claiming voting rewards. Transaction: ${hash}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error claiming voting rewards:", error);
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to claim voting rewards",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [
    selectedContract,
    connectedAddress,
    isOnMainnet,
    isBeneficiary,
    merklData,
    writeContractAsync,
    toast,
  ]);

  return (
    <Container maxW="container.lg">
      <Box mb={6}>
        <Heading as="h2" size="lg" variant="special" mb={4}>
          sdBAL Vesting Manager
        </Heading>
        <Text fontSize="md" color="font.secondary">
          Internal tool for managing sdBAL vesting contracts and claiming available rewards.
        </Text>
      </Box>

      <Alert status="info" mb={6} py={4} variant="left-accent" borderRadius="md">
        <Box flex="1">
          <Flex align="center">
            <AlertIcon boxSize="20px" />
            <AlertTitle fontSize="lg" ml={2}>
              sdBAL Vesting Rewards
            </AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <Text fontSize="sm" mt={2}>
              Manage your sdBAL vesting contract rewards. This tool allows authorized beneficiaries
              to:
            </Text>
            <Text fontSize="sm" mt={1} ml={4}>
              • Claim regular vesting rewards (claimRewards)
            </Text>
            <Text fontSize="sm" mt={1} ml={4}>
              • Claim voting rewards with Merkl proofs (claimVotingRewards)
            </Text>
          </AlertDescription>
        </Box>
      </Alert>

      {/* Contract Selection */}
      <Card mb={6} variant="level1">
        <CardHeader>
          <Heading as="h3" size="md">
            Select Vesting Contract
          </Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Available Vesting Contracts
              </Text>
              <Select
                placeholder="Select a vesting contract"
                value={selectedContract?.address || ""}
                onChange={e => handleContractSelect(e.target.value)}
              >
                {vestingContracts.map(contract => (
                  <option key={contract.address} value={contract.address}>
                    {contract.name}
                  </option>
                ))}
              </Select>
            </Box>

            {selectedContract && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Selected Contract</AlertTitle>
                  <AlertDescription>
                    {selectedContract.name}
                    <br />
                    <Text as="span" fontFamily="mono" fontSize="sm">
                      {selectedContract.address}
                    </Text>
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Network Status */}
      {connectedAddress && !isOnMainnet && (
        <Alert status="error" mb={6} py={4} variant="left-accent" borderRadius="md">
          <Box flex="1">
            <Flex align="center">
              <AlertIcon boxSize="20px" />
              <AlertTitle fontSize="lg" ml={2}>
                Wrong Network
              </AlertTitle>
            </Flex>
            <AlertDescription display="block">
              <Text fontSize="sm" mb={3}>
                sdBAL vesting contracts are deployed on Ethereum Mainnet. Please switch to mainnet
                to continue.
              </Text>
              <Button colorScheme="blue" size="sm" onClick={handleSwitchToMainnet}>
                Switch to Mainnet
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Wallet & Authorization Status */}
      {selectedContract && isOnMainnet && (
        <Card mb={6} variant="level1">
          <CardBody>
            {!connectedAddress ? (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontWeight="medium">
                  Please connect your wallet to continue
                </AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {/* Wallet Information */}
                <Box>
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text
                        fontSize="xs"
                        color="font.secondary"
                        fontWeight="medium"
                        textTransform="uppercase"
                      >
                        Connected Wallet
                      </Text>
                      <Text
                        fontSize="md"
                        fontFamily="mono"
                        color="font.primary"
                        fontWeight="medium"
                      >
                        {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-6)}
                      </Text>
                    </VStack>
                    <Box w="8px" h="8px" bg="green.400" borderRadius="full" />
                  </HStack>
                </Box>

                {/* Authorization Status */}
                <Box pt={2} borderTop="1px" borderColor="border.base">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text
                        fontSize="xs"
                        color="font.secondary"
                        fontWeight="medium"
                        textTransform="uppercase"
                      >
                        Authorization Status
                      </Text>
                      {isLoadingBeneficiary ? (
                        <Text fontSize="md" color="font.secondary" fontWeight="medium">
                          Verifying permissions...
                        </Text>
                      ) : (
                        <Text
                          fontSize="md"
                          color={isBeneficiary ? "green.600" : "red.600"}
                          fontWeight="semibold"
                        >
                          {isBeneficiary ? "Authorized Beneficiary" : "Access Denied"}
                        </Text>
                      )}
                    </VStack>
                    {!isLoadingBeneficiary && (
                      <Badge
                        colorScheme={isBeneficiary ? "green" : "red"}
                        size="md"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="semibold"
                      >
                        {isBeneficiary ? "✓ Verified" : "✗ Denied"}
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </VStack>
            )}
          </CardBody>
        </Card>
      )}

      {/* Claimable Amounts & Action Buttons */}
      {selectedContract && connectedAddress && isOnMainnet && isBeneficiary && (
        <Card mb={4} variant="level1">
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Voting Rewards Section */}
              {claimableVotingRewards && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={3} color="font.primary">
                    Voting Rewards Available
                  </Text>
                  <Card variant="subSection">
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Text fontSize="2xl" fontWeight="bold" color="font.primary">
                                {parseFloat(claimableVotingRewards.amount).toFixed(4)}
                              </Text>
                              <Text fontSize="lg" color="font.secondary" fontWeight="medium">
                                sdBAL
                              </Text>
                            </HStack>
                            {claimableVotingRewards.usdValue && (
                              <Text fontSize="md" color="font.secondary" fontWeight="medium">
                                ≈ ${claimableVotingRewards.usdValue} USD
                              </Text>
                            )}
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <Badge variant="meta" size="md">
                              Merkl
                            </Badge>
                            <Text fontSize="xs" color="font.secondary">
                              Voting Incentives
                            </Text>
                          </VStack>
                        </HStack>

                        <Button
                          variant="secondary"
                          size="md"
                          onClick={handleClaimVotingRewards}
                          isLoading={isLoadingMerkl}
                          loadingText="Loading Merkl data..."
                          fontWeight="bold"
                          w="full"
                        >
                          Claim Voting Rewards (
                          {parseFloat(claimableVotingRewards.amount).toFixed(2)} sdBAL)
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>
              )}

              {/* Gauge Rewards Section */}
              {vestingRewards.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={3} color="font.primary">
                    Gauge Rewards Available
                  </Text>
                  <Card variant="subSection">
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <VStack spacing={3}>
                          {vestingRewards.map(reward => {
                            return (
                              <Box
                                key={reward.symbol}
                                p={4}
                                bg="background.level3"
                                borderRadius="md"
                                w="full"
                              >
                                <HStack justify="space-between" align="start">
                                  <VStack align="start" spacing={1}>
                                    <HStack>
                                      <Text fontSize="xl" fontWeight="bold" color="font.primary">
                                        {parseFloat(reward.amount).toFixed(
                                          reward.symbol === "USDC" ? 2 : 4,
                                        )}
                                      </Text>
                                      <Text
                                        fontSize="md"
                                        color="font.secondary"
                                        fontWeight="medium"
                                      >
                                        {reward.symbol}
                                      </Text>
                                    </HStack>
                                    {reward.usdValue && (
                                      <Text fontSize="sm" color="font.secondary">
                                        ≈ ${reward.usdValue} USD
                                      </Text>
                                    )}
                                  </VStack>
                                  <Text fontSize="xs" color="font.secondary">
                                    {reward.symbol === "USDC" ? "Stablecoin" : "Governance Token"}
                                  </Text>
                                </HStack>
                              </Box>
                            );
                          })}
                        </VStack>

                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleClaimRewards}
                          fontWeight="bold"
                          w="full"
                        >
                          Claim Gauge Rewards ({vestingRewards.map(r => r.symbol).join(", ")})
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Data Status */}
      {isLoadingMerkl && (
        <Alert status="info" size="sm">
          <AlertIcon />
          <AlertDescription fontSize="sm">Loading voting rewards data...</AlertDescription>
        </Alert>
      )}
    </Container>
  );
}
