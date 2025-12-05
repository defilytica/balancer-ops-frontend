"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
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
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useSwitchChain,
} from "wagmi";
import { useQuery } from "@apollo/client";
import { useQuery as useReactQuery } from "@tanstack/react-query";
import { AddressBook } from "@/types/interfaces";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import { sdBALVesterABI } from "@/abi/sdBALVester";
import { gaugeABI } from "@/abi/gauge";
import { merkleStashABI } from "@/abi/merkleStash";
import {
  CurrentTokenPricesDocument,
  GetTokensDocument,
  GqlChain,
} from "@/lib/services/apollo/generated/graphql";
import { SDBAL_TOKEN_ADDRESS, WHITELISTED_PAYMENT_TOKENS } from "@/constants/constants";

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

interface VestingPosition {
  nonce: number;
  amount: bigint;
  vestingEnds: bigint;
  claimed: boolean;
}

export default function SdbalVestingManager({ addressBook }: SdbalVestingManagerProps) {
  const [selectedContract, setSelectedContract] = useState<VestingContract | null>(null);
  const [merklData, setMerklData] = useState<MerklData | null>(null);
  const [merklLastUpdate, setMerklLastUpdate] = useState<string | null>(null);

  const { address: connectedAddress, chainId } = useAccount();
  const toast = useToast();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const MAINNET_CHAIN_ID = 1;
  const isOnMainnet = chainId === MAINNET_CHAIN_ID;

  // Get token addresses from constants
  const USDC_ADDRESS =
    WHITELISTED_PAYMENT_TOKENS.mainnet?.find(t => t.symbol === "USDC")?.address || "";
  const BAL_ADDRESS =
    WHITELISTED_PAYMENT_TOKENS.mainnet?.find(t => t.symbol === "BAL")?.address || "";

  // Fetch sdBAL token price
  const { data: priceData } = useQuery(CurrentTokenPricesDocument, {
    variables: { chains: ["MAINNET" as GqlChain] },
    context: {
      uri: "https://api-v3.balancer.fi/",
    },
  });

  // Fetch token metadata including logos
  const { data: tokenData } = useQuery(GetTokensDocument, {
    variables: {
      chainIn: ["MAINNET" as GqlChain],
      tokensIn: [SDBAL_TOKEN_ADDRESS, USDC_ADDRESS, BAL_ADDRESS],
    },
    context: {
      uri: "https://api-v3.balancer.fi/",
    },
  });

  const sdBALPrice = useMemo(() => {
    if (!priceData?.tokenGetCurrentPrices) return null;
    const price = priceData.tokenGetCurrentPrices.find(
      p => p.address.toLowerCase() === SDBAL_TOKEN_ADDRESS.toLowerCase(),
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

  // Read the merkle stash address from the selected contract
  const { data: merkleStashAddress } = useReadContract({
    address: selectedContract?.address as `0x${string}`,
    abi: sdBALVesterABI,
    functionName: "VOTING_REWARDS_MERKLE_STASH",
    query: {
      enabled: !!selectedContract?.address && isOnMainnet,
    },
  });

  // Get token logos from fetched data
  const getTokenLogo = useCallback(
    (address: string) => {
      const token = tokenData?.tokenGetTokens.find(
        t => t.address.toLowerCase() === address.toLowerCase(),
      );
      return token?.logoURI || null;
    },
    [tokenData],
  );

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
  }, [priceData?.tokenGetCurrentPrices, USDC_ADDRESS]);

  const balPrice = useMemo(() => {
    if (!priceData?.tokenGetCurrentPrices) return null;
    const price = priceData.tokenGetCurrentPrices.find(
      p => p.address.toLowerCase() === BAL_ADDRESS.toLowerCase(),
    );
    return price?.price || null;
  }, [priceData?.tokenGetCurrentPrices, BAL_ADDRESS]);

  // Check if the current merkle proof has already been claimed
  const { data: isAlreadyClaimed, isLoading: isCheckingClaimed } = useReadContract({
    address: merkleStashAddress as `0x${string}`,
    abi: merkleStashABI,
    functionName: "isClaimed",
    args: [
      SDBAL_TOKEN_ADDRESS as `0x${string}`,
      merklData && selectedContract
        ? BigInt(merklData[selectedContract.address.toLowerCase()]?.index || 0)
        : BigInt(0),
    ],
    query: {
      enabled:
        !!merkleStashAddress &&
        !!merklData &&
        !!selectedContract &&
        !!merklData[selectedContract.address.toLowerCase()] &&
        isOnMainnet,
    },
  });

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

  // Calculate total claimable value in USD
  const totalClaimableUSD = useMemo(() => {
    let total = 0;

    // Add voting rewards value only if not already claimed
    if (claimableVotingRewards?.usdValue && !isAlreadyClaimed) {
      total += parseFloat(claimableVotingRewards.usdValue);
    }

    // Add vesting rewards values
    vestingRewards.forEach(reward => {
      if (reward.usdValue) {
        total += parseFloat(reward.usdValue);
      }
    });

    return total.toFixed(2);
  }, [claimableVotingRewards, vestingRewards, isAlreadyClaimed]);

  // Get all stake_dao vesting contracts from the address book
  const vestingContracts = useMemo(() => {
    const contracts: VestingContract[] = [];

    // Get networks that have stake_dao category
    Object.keys(addressBook.active).forEach(network => {
      const stakeDAOData = getCategoryData(addressBook, network, "stake_dao");
      if (stakeDAOData) {
        Object.entries(stakeDAOData).forEach(([name, address]) => {
          if (name.includes("Vester") && typeof address === "string") {
            // Simplify the display name - remove "-Vester" suffix and capitalize
            const simplifiedName = name
              .replace("-Vester", "")
              .replace("_Vester", "")
              .split("-")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            contracts.push({
              name: `${simplifiedName} (${network})`,
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

  // Read the vesting nonce (total number of vesting positions)
  const { data: vestingNonce, isLoading: isLoadingNonce } = useReadContract({
    address: selectedContract?.address as `0x${string}`,
    abi: sdBALVesterABI,
    functionName: "getVestingNonce",
    query: {
      enabled: !!selectedContract?.address && isOnMainnet && isBeneficiary,
    },
  });

  // Fetch all vesting positions based on the nonce
  const vestingPositionContracts = useMemo(() => {
    if (!vestingNonce || !selectedContract?.address) return [];

    const nonce = Number(vestingNonce);
    const contracts = [];

    for (let i = 0; i < nonce; i++) {
      contracts.push({
        address: selectedContract.address as `0x${string}`,
        abi: sdBALVesterABI as any,
        functionName: "getVestingPosition" as const,
        args: [BigInt(i)],
      });
    }

    return contracts;
  }, [vestingNonce, selectedContract?.address]);

  const { data: vestingPositionsData, isLoading: isLoadingPositions } = useReadContracts({
    contracts: vestingPositionContracts as any,
    query: {
      enabled: vestingPositionContracts.length > 0 && isOnMainnet && isBeneficiary,
    },
  });

  // Process vesting positions data
  const vestingPositions = useMemo(() => {
    if (!vestingPositionsData) return [];

    return vestingPositionsData
      .map((result, index) => {
        if (result.status === "success" && result.result) {
          // Handle both array and object return formats
          const data = result.result as any;

          // Check if it's an object with named properties or an array
          const amount = data.amount !== undefined ? BigInt(data.amount) : BigInt(data[0] || 0);
          const vestingEnds =
            data.vestingEnds !== undefined ? BigInt(data.vestingEnds) : BigInt(data[1] || 0);
          const claimed = data.claimed !== undefined ? Boolean(data.claimed) : Boolean(data[2]);

          console.log("Vesting position data:", {
            index,
            amount: amount.toString(),
            vestingEnds: vestingEnds.toString(),
            claimed,
          });

          return {
            nonce: index,
            amount,
            vestingEnds,
            claimed,
          };
        }
        return null;
      })
      .filter((pos): pos is VestingPosition => pos !== null);
  }, [vestingPositionsData]);

  // Custom hook to fetch Merkl data
  const fetchMerklData = useCallback(async () => {
    // Add timestamp to bypass cache during development
    const response = await fetch(`/api/merkl?t=${Date.now()}`, {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch Merkl data");
    }
    return response.json();
  }, []);

  // Use React Query for Merkl data fetching
  const {
    data: merklResponse,
    isLoading: isLoadingMerkl,
    error: merklError,
    refetch: refetchMerkl,
  } = useReactQuery({
    queryKey: ["merkl-data"],
    queryFn: fetchMerklData,
    refetchInterval: 6 * 60 * 60 * 1000, // Refetch every 6 hours
    staleTime: 3 * 60 * 60 * 1000, // Consider data stale after 3 hours
    gcTime: 6 * 60 * 60 * 1000, // Garbage collect after 6 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus to save API calls
  });

  // Process Merkl data
  useEffect(() => {
    if (merklResponse?.data) {
      // Ensure all addresses in merkl data are lowercase
      const normalizedData: MerklData = {};
      Object.entries(merklResponse.data as MerklData).forEach(([address, data]) => {
        normalizedData[address.toLowerCase()] = data as MerklData[string];
      });

      setMerklData(normalizedData);
      setMerklLastUpdate(merklResponse.timestamp);
      console.log(`Merkl data loaded: ${Object.keys(normalizedData).length} addresses`);
      console.log(`Data timestamp: ${merklResponse.timestamp}`);
      console.log(`Next update: ${merklResponse.nextUpdate}`);

      // Log sample addresses to verify we have the latest data
      const sampleAddresses = Object.keys(normalizedData).slice(0, 3);
      console.log("Sample addresses in merkl data:", sampleAddresses);
    }
  }, [merklResponse]);

  // Handle Merkl data error
  useEffect(() => {
    if (merklError) {
      console.error("Error fetching Merkl data:", merklError);
      toast({
        title: "Error fetching Merkl data",
        description: "Could not load voting rewards data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [merklError, toast]);

  const handleSwitchToMainnet = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: MAINNET_CHAIN_ID });
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
  }, [switchChainAsync, toast]);

  const handleContractSelect = useCallback(
    (contractAddress: string) => {
      const contract = vestingContracts.find(c => c.address === contractAddress);
      setSelectedContract(contract || null);
    },
    [vestingContracts],
  );

  // Shared validation for claim functions
  const validateClaim = useCallback(
    (rewardType: string): boolean => {
      if (!selectedContract || !connectedAddress) {
        toast({
          title: "Error",
          description: "Please connect your wallet and select a vesting contract",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      if (!isOnMainnet) {
        toast({
          title: "Wrong network",
          description: `Please switch to Ethereum Mainnet to claim ${rewardType}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      if (!isBeneficiary) {
        toast({
          title: "Not authorized",
          description: "You are not the beneficiary of this vesting contract",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      return true;
    },
    [selectedContract, connectedAddress, isOnMainnet, isBeneficiary, toast],
  );

  const handleClaimRewards = useCallback(async () => {
    if (!validateClaim("rewards")) return;

    try {
      const hash = await writeContractAsync({
        address: selectedContract!.address as `0x${string}`,
        abi: sdBALVesterABI,
        functionName: "claimRewards",
        args: [],
      });

      toast({
        title: "Transaction submitted",
        description: `Claiming gauge rewards. Transaction: ${hash}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to claim gauge rewards",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [validateClaim, selectedContract, writeContractAsync, toast]);

  const handleClaimVotingRewards = useCallback(async () => {
    if (!validateClaim("voting rewards")) return;

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

    if (Boolean(isAlreadyClaimed)) {
      toast({
        title: "Already claimed",
        description: "This merkle proof has already been claimed",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Use sdBAL token address from constants

    // Use the vesting contract address for merkl data lookup
    const vesterAddress = selectedContract!.address.toLowerCase();
    const finalData = merklData[vesterAddress];

    console.log("=== Merkl Address Lookup ===");
    console.log("Vesting contract address (original):", selectedContract!.address);
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
        token: SDBAL_TOKEN_ADDRESS,
        index,
        amount: amount.toString(),
        amountHex,
        proofs: proofs.length + " proofs",
        firstProof: proofs[0],
        vesterAddress,
        beneficiary: connectedAddress,
      });

      const hash = await writeContractAsync({
        address: selectedContract!.address as `0x${string}`,
        abi: sdBALVesterABI,
        functionName: "claimVotingRewards",
        args: [
          SDBAL_TOKEN_ADDRESS, // token address as string
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
    validateClaim,
    selectedContract,
    connectedAddress,
    isOnMainnet,
    isBeneficiary,
    merklData,
    isAlreadyClaimed,
    writeContractAsync,
    toast,
  ]);

  // Helper function to format dates (absolute + relative)
  const formatVestingDate = useCallback((vestingEnds: bigint) => {
    const date = new Date(Number(vestingEnds) * 1000);
    const now = Date.now();
    const vestingTime = date.getTime();
    const diffMs = vestingTime - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const absoluteDate = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let relativeTime = "";
    if (diffDays > 0) {
      if (diffDays === 1) {
        relativeTime = "in 1 day";
      } else if (diffDays < 30) {
        relativeTime = `in ${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        relativeTime = months === 1 ? "in 1 month" : `in ${months} months`;
      } else {
        const years = Math.floor(diffDays / 365);
        relativeTime = years === 1 ? "in 1 year" : `in ${years} years`;
      }
    } else if (diffDays === 0) {
      relativeTime = "today";
    } else {
      const absDays = Math.abs(diffDays);
      if (absDays === 1) {
        relativeTime = "1 day ago";
      } else if (absDays < 30) {
        relativeTime = `${absDays} days ago`;
      } else if (absDays < 365) {
        const months = Math.floor(absDays / 30);
        relativeTime = months === 1 ? "1 month ago" : `${months} months ago`;
      } else {
        const years = Math.floor(absDays / 365);
        relativeTime = years === 1 ? "1 year ago" : `${years} years ago`;
      }
    }

    return { absoluteDate, relativeTime, diffDays };
  }, []);

  // Handle claiming a specific vesting position
  const handleClaimVesting = useCallback(
    async (nonce: number) => {
      if (!validateClaim("vesting position")) return;

      try {
        const hash = await writeContractAsync({
          address: selectedContract!.address as `0x${string}`,
          abi: sdBALVesterABI,
          functionName: "claim",
          args: [BigInt(nonce)],
        });

        toast({
          title: "Transaction submitted",
          description: `Claiming vesting position #${nonce}. Transaction: ${hash}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (error: any) {
        console.error("Error claiming vesting position:", error);
        toast({
          title: "Transaction failed",
          description: error.message || "Failed to claim vesting position",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [validateClaim, selectedContract, writeContractAsync, toast],
  );

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
                        {connectedAddress}
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

      {/* Claimable Rewards Section */}
      {selectedContract && connectedAddress && isOnMainnet && isBeneficiary && (
        <>
          <Box mb={8} mt={6}>
            <Heading as="h3" size="md" mb={2}>
              Immediate Claimable Rewards
            </Heading>
            <Text fontSize="sm" color="font.secondary">
              Rewards that are ready to be claimed right now
            </Text>
          </Box>

          <Card mb={8} variant="level1">
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Total Claimable Summary */}
                {(parseFloat(totalClaimableUSD) > 0 ||
                  claimableVotingRewards ||
                  vestingRewards.length > 0) && (
                  <Box
                    p={4}
                    bg="background.level2"
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="border.highlight"
                  >
                    <HStack justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Text
                          fontSize="sm"
                          color="font.secondary"
                          fontWeight="medium"
                          textTransform="uppercase"
                        >
                          Total Claimable Value
                        </Text>
                        <Text fontSize="3xl" fontWeight="bold" color="font.primary">
                          ${totalClaimableUSD}
                        </Text>
                        <Text fontSize="xs" color="font.secondary">
                          Across all reward types
                        </Text>
                      </VStack>
                      <Box>
                        <Badge colorScheme="green" size="lg" px={3} py={2} borderRadius="md">
                          {(claimableVotingRewards ? 1 : 0) + vestingRewards.length} Rewards
                          Available
                        </Badge>
                      </Box>
                    </HStack>
                  </Box>
                )}
                {/* Voting Rewards Section */}
                {claimableVotingRewards && (
                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" color="font.primary">
                        Voting Rewards
                      </Text>
                      <Text fontSize="sm" color="font.secondary">
                        Compounded as sdBAL
                      </Text>
                    </HStack>
                    <Card variant="subSection">
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack
                            justify="space-between"
                            align="center"
                            p={3}
                            bg="background.level3"
                            borderRadius="lg"
                          >
                            <HStack spacing={3}>
                              <Avatar
                                src={getTokenLogo(SDBAL_TOKEN_ADDRESS) || undefined}
                                name="sdBAL"
                                size="sm"
                                bg="gray.500"
                              />
                              <VStack align="start" spacing={0}>
                                <HStack spacing={2}>
                                  <Text fontSize="lg" fontWeight="bold" color="font.primary">
                                    {parseFloat(claimableVotingRewards.amount).toFixed(4)}
                                  </Text>
                                  <Text fontSize="md" color="font.secondary" fontWeight="medium">
                                    sdBAL
                                  </Text>
                                </HStack>
                                {claimableVotingRewards.usdValue && (
                                  <Text fontSize="sm" color="font.secondary">
                                    ≈ ${claimableVotingRewards.usdValue}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                            <Badge variant="meta" size="sm">
                              Merkl Rewards
                            </Badge>
                          </HStack>

                          <VStack spacing={2}>
                            {/* Claim Status Info */}
                            {isCheckingClaimed ? (
                              <Badge colorScheme="gray" size="sm">
                                Checking claim status...
                              </Badge>
                            ) : Boolean(isAlreadyClaimed) ? (
                              <Badge colorScheme="red" size="sm" px={3} py={1}>
                                ✗ Already Claimed
                              </Badge>
                            ) : (
                              <Badge colorScheme="green" size="sm" px={3} py={1}>
                                ✓ Available to Claim
                              </Badge>
                            )}

                            <Flex justify="center">
                              <Button
                                variant="secondary"
                                size="md"
                                onClick={handleClaimVotingRewards}
                                isLoading={isLoadingMerkl || isCheckingClaimed}
                                loadingText={
                                  isLoadingMerkl
                                    ? "Loading Merkl data..."
                                    : "Checking claim status..."
                                }
                                isDisabled={Boolean(isAlreadyClaimed)}
                                fontWeight="bold"
                                maxW="320px"
                              >
                                {Boolean(isAlreadyClaimed)
                                  ? "Already Claimed"
                                  : `Claim Voting Rewards (${parseFloat(claimableVotingRewards.amount).toFixed(2)} sdBAL)`}
                              </Button>
                            </Flex>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {/* Gauge Rewards Section */}
                {vestingRewards.length > 0 && (
                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" color="font.primary">
                        Gauge Rewards
                      </Text>
                      <Text fontSize="sm" color="font.secondary">
                        Passive fees
                      </Text>
                    </HStack>
                    <Card variant="subSection">
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <VStack spacing={2}>
                            {vestingRewards.map(reward => {
                              const tokenAddress =
                                reward.symbol === "USDC" ? USDC_ADDRESS : BAL_ADDRESS;
                              return (
                                <HStack
                                  key={reward.symbol}
                                  justify="space-between"
                                  align="center"
                                  p={3}
                                  bg="background.level3"
                                  borderRadius="lg"
                                  w="full"
                                >
                                  <HStack spacing={3}>
                                    <Avatar
                                      src={getTokenLogo(tokenAddress) || undefined}
                                      name={reward.symbol}
                                      size="sm"
                                      bg="gray.500"
                                    />
                                    <VStack align="start" spacing={0}>
                                      <HStack spacing={2}>
                                        <Text fontSize="lg" fontWeight="bold" color="font.primary">
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
                                          ≈ ${reward.usdValue}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <Badge
                                    variant="subtle"
                                    colorScheme={reward.symbol === "USDC" ? "green" : "purple"}
                                    size="sm"
                                  >
                                    {reward.symbol === "USDC" ? "Stable" : "Governance"}
                                  </Badge>
                                </HStack>
                              );
                            })}
                          </VStack>

                          <Flex justify="center">
                            <Button
                              variant="primary"
                              size="md"
                              onClick={handleClaimRewards}
                              fontWeight="bold"
                              maxW="320px"
                            >
                              Claim Gauge Rewards ({vestingRewards.map(r => r.symbol).join(", ")})
                            </Button>
                          </Flex>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        </>
      )}

      {/* Vesting Schedule Section */}
      {selectedContract &&
        connectedAddress &&
        isOnMainnet &&
        isBeneficiary &&
        vestingPositions.length > 0 && (
          <>
            <Box mb={6} mt={10}>
              <Heading as="h3" size="md" mb={2}>
                Vesting Schedule
              </Heading>
              <Text fontSize="sm" color="font.secondary">
                Your locked sdBAL positions with their unlock dates and claim status
              </Text>
            </Box>

            <Card mb={4} variant="level1">
              <CardHeader>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold" fontSize="md" color="font.primary">
                    All Vesting Positions
                  </Text>
                  <Badge colorScheme="blue" px={3} py={1}>
                    {vestingPositions.length} Position{vestingPositions.length !== 1 ? "s" : ""}
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                {isLoadingNonce || isLoadingPositions ? (
                  <Flex justify="center" align="center" py={8}>
                    <Text color="font.secondary">Loading vesting positions...</Text>
                  </Flex>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Position</Th>
                          <Th isNumeric>Amount</Th>
                          <Th>Vesting Ends</Th>
                          <Th>Status</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {vestingPositions.map(position => {
                          const { absoluteDate, relativeTime, diffDays } = formatVestingDate(
                            position.vestingEnds,
                          );
                          const isClaimable = diffDays <= 0 && !position.claimed;
                          const sdBALAmount = (Number(position.amount) / 1e18).toFixed(4);
                          const usdValue = sdBALPrice
                            ? (parseFloat(sdBALAmount) * sdBALPrice).toFixed(2)
                            : null;

                          return (
                            <Tr key={position.nonce}>
                              <Td>
                                <Text fontWeight="medium" fontFamily="mono">
                                  #{position.nonce}
                                </Text>
                              </Td>
                              <Td isNumeric>
                                <VStack align="end" spacing={0}>
                                  <HStack spacing={1}>
                                    <Text fontWeight="bold" fontSize="sm">
                                      {sdBALAmount}
                                    </Text>
                                    <Text fontSize="xs" color="font.secondary">
                                      sdBAL
                                    </Text>
                                  </HStack>
                                  {usdValue && (
                                    <Text fontSize="xs" color="font.secondary">
                                      ≈ ${usdValue}
                                    </Text>
                                  )}
                                </VStack>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {absoluteDate}
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    color={diffDays <= 0 ? "green.600" : "font.secondary"}
                                  >
                                    {relativeTime}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                {position.claimed ? (
                                  <Badge colorScheme="gray" variant="subtle">
                                    Claimed
                                  </Badge>
                                ) : isClaimable ? (
                                  <Badge colorScheme="green" variant="subtle">
                                    Claimable
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="orange" variant="subtle">
                                    Locked
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                                {position.claimed ? (
                                  <Button size="sm" isDisabled variant="ghost">
                                    Claimed
                                  </Button>
                                ) : isClaimable ? (
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="secondary"
                                    onClick={() => handleClaimVesting(position.nonce)}
                                  >
                                    Claim
                                  </Button>
                                ) : (
                                  <Tooltip
                                    label={`Available ${relativeTime}`}
                                    placement="top"
                                    hasArrow
                                  >
                                    <Box display="inline-block">
                                      <Button size="sm" isDisabled variant="ghost">
                                        Locked
                                      </Button>
                                    </Box>
                                  </Tooltip>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          </>
        )}

      {/* Data Status */}
      {isLoadingMerkl && (
        <Alert status="info" size="sm">
          <AlertIcon />
          <AlertDescription fontSize="sm">Loading voting rewards data...</AlertDescription>
        </Alert>
      )}

      {/* Merkl Data Update Indicator */}
      {merklLastUpdate && !isLoadingMerkl && (
        <Box mt={4}>
          <Flex justify="center" align="center" gap={3}>
            <Text fontSize="xs" color="font.secondary">
              Merkl tree last updated: {new Date(merklLastUpdate).toLocaleString()} (UI updates data
              every 6h)
            </Text>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => refetchMerkl()}
              isLoading={isLoadingMerkl}
            >
              Refresh
            </Button>
          </Flex>
        </Box>
      )}
    </Container>
  );
}
