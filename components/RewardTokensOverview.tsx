import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { NetworkSelector } from "@/components/NetworkSelector";
import { useRewardTokenData } from "@/lib/hooks/useRewardTokenData";
import { RewardTokenData } from "@/types/rewardTokenTypes";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import { gaugeABI } from "@/abi/gauge";
import { ERC20 } from "@/abi/erc20";
import { useQuery } from "@apollo/client";
import {
  GetTokensDocument,
  GetTokensQuery,
  GetTokensQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import RewardTokensTable from "@/components/tables/RewardTokensTable";

interface RewardTokensOverviewProps {}

const RewardTokensOverview: React.FC<RewardTokensOverviewProps> = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);
  const [showDistributorOnly, setShowDistributorOnly] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [selectedPool, setSelectedPool] = useState<RewardTokenData | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [shouldSkipApproval, setShouldSkipApproval] = useState<boolean>(false);
  const [injectorAddresses, setInjectorAddresses] = useState<Set<string>>(new Set());
  const [v2InjectorAddresses, setV2InjectorAddresses] = useState<Set<string>>(new Set());

  const { data, loading, error, refetch } = useRewardTokenData(selectedNetwork);
  const { address } = useAccount();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Collect all unique token addresses from the data
  const tokenAddresses = useMemo(() => {
    if (!data) return [];
    const addresses = new Set<string>();
    data.forEach(pool => {
      pool.rewardTokens.forEach(token => {
        addresses.add(token.address);
      });
    });
    return Array.from(addresses);
  }, [data]);

  // Query for token images
  const { data: tokenData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(GetTokensDocument, {
    variables: {
      chainIn: [selectedNetwork as any],
      tokensIn: tokenAddresses,
    },
    skip: !selectedNetwork || tokenAddresses.length === 0,
  });

  // Create a map of token address to logoURI for quick lookup
  const tokenLogos = useMemo(() => {
    if (!tokenData) return {};
    const logoMap: { [address: string]: string } = {};
    tokenData.tokenGetTokens.forEach(token => {
      logoMap[token.address.toLowerCase()] = token.logoURI || "";
    });
    return logoMap;
  }, [tokenData]);

  // Fetch injector addresses when component mounts
  useEffect(() => {
    const fetchV1InjectorsData = async () => {
      try {
        const url = `/api/injector/v1/all`;
        const response = await fetch(url);

        if (response.status === 429) {
          console.warn(`Rate limited for v1 injectors. Please try again later.`);
          return [];
        }

        if (!response.ok) {
          console.warn(`Failed to fetch v1 injectors:`, response.status);
          return [];
        }

        const data = await response.json();
        return data || [];
      } catch (error) {
        console.warn(`Error fetching v1 injector addresses:`, error);
        return [];
      }
    };

    const fetchV2InjectorsData = async () => {
      try {
        // First fetch the factories (same pattern as RewardsInjectorContainer)
        const factoryResponse = await fetch(`/api/injector/v2/factory`);

        if (!factoryResponse.ok) {
          console.warn(`Failed to fetch v2 factory data:`, factoryResponse.status);
          return [];
        }

        const factoryData = await factoryResponse.json();

        if (!Array.isArray(factoryData)) {
          console.warn("V2 factory data is not an array:", factoryData);
          return [];
        }

        // Then fetch individual injectors for each address (same as RewardsInjectorContainer)
        const injectorPromises = [];
        for (const item of factoryData) {
          const network = item.network;
          // Create promises for each injector
          for (const address of item.deployedInjectors) {
            injectorPromises.push(
              fetch(`/api/injector/v2/single?address=${address}&network=${network}`)
                .then(response => response.json())
                .then(tokenData => ({
                  network: network,
                  address: address,
                  token: tokenData.tokenInfo?.symbol || "",
                  tokenAddress: tokenData.tokenInfo?.address || "",
                }))
                .catch(error => {
                  console.warn(`Error fetching v2 injector info for ${address}:`, error);
                  return {
                    network: network,
                    address: address,
                    token: "",
                    tokenAddress: "",
                  };
                }),
            );
          }
        }

        // Wait for all promises to resolve
        const results = await Promise.all(injectorPromises);
        return results;
      } catch (error) {
        console.warn(`Error fetching v2 injector addresses:`, error);
        return [];
      }
    };

    const fetchAllInjectorAddresses = async () => {
      const addresses = new Set<string>();
      const v2Addresses = new Set<string>();

      // Fetch both versions independently
      const [v1Data, v2Data] = await Promise.all([fetchV1InjectorsData(), fetchV2InjectorsData()]);

      // Process V1 data
      v1Data.forEach((injector: any) => {
        if (injector?.address) {
          addresses.add(injector.address.toLowerCase());
        }
      });

      // Process V2 data
      v2Data.forEach((injector: any) => {
        if (injector?.address) {
          addresses.add(injector.address.toLowerCase());
          v2Addresses.add(injector.address.toLowerCase());
        }
      });

      setInjectorAddresses(addresses);
      setV2InjectorAddresses(v2Addresses);
    };

    fetchAllInjectorAddresses();
  }, []);

  // Check if a distributor address is a reward injector
  const isRewardInjector = (distributorAddress: string) => {
    return injectorAddresses.has(distributorAddress.toLowerCase());
  };

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isDepositing, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: ERC20,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!(selectedToken?.address && address),
    },
  }) as { data: bigint | undefined; refetch: () => void };

  // Read token allowance
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: ERC20,
    functionName: "allowance",
    args: [address as `0x${string}`, selectedPool?.gaugeAddress as `0x${string}`],
    query: {
      enabled: !!(selectedToken?.address && address && selectedPool?.gaugeAddress),
    },
  }) as { data: bigint | undefined; refetch: () => void };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
  };

  const formatEndDate = (periodFinish: string) => {
    const timestamp = parseInt(periodFinish);
    if (timestamp === 0) return "No end date";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const isDistributor = (tokenDistributor: string): boolean => {
    return !!(address && address.toLowerCase() === tokenDistributor.toLowerCase());
  };

  const isDistributorForPool = (pool: RewardTokenData) => {
    return pool.rewardTokens.some(token => isDistributor(token.distributor));
  };

  // Helper function to format token balance
  const formatTokenBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0";
    return parseFloat(ethers.formatUnits(balance, decimals)).toFixed(6);
  };

  // Check if current allowance is sufficient
  const checkAllowanceSufficient = (amount: string) => {
    if (!tokenAllowance || !selectedToken || !amount) return false;
    try {
      const amountWei = ethers.parseUnits(amount, selectedToken.decimals);
      return tokenAllowance >= amountWei;
    } catch {
      return false;
    }
  };

  // Effect to check allowance when amount changes
  useEffect(() => {
    if (rewardAmount && tokenAllowance !== undefined && selectedToken) {
      const sufficient = checkAllowanceSufficient(rewardAmount);
      setShouldSkipApproval(sufficient);

      // If allowance is sufficient and we're on step 1, move to step 2
      if (sufficient && currentStep === 1) {
        setCurrentStep(2);
      }

      // If allowance is insufficient and we're on step 2, go back to step 1
      if (!sufficient && currentStep === 2) {
        setCurrentStep(1);
      }
    }
  }, [rewardAmount, tokenAllowance, selectedToken, currentStep]);

  const openAddRewardsModal = (pool: RewardTokenData, token: any) => {
    setSelectedPool(pool);
    setSelectedToken(token);
    setRewardAmount("");
    setCurrentStep(1);
    setShouldSkipApproval(false);
    onOpen();
  };

  const closeAddRewardsModal = () => {
    setSelectedPool(null);
    setSelectedToken(null);
    setRewardAmount("");
    setCurrentStep(1);
    setShouldSkipApproval(false);
    onClose();
  };

  const handleApprove = async () => {
    if (!selectedPool || !selectedToken || !rewardAmount || parseFloat(rewardAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid reward amount",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if user has sufficient balance
    if (tokenBalance !== undefined) {
      try {
        const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
        if (amountWei > tokenBalance) {
          toast({
            title: "Insufficient balance",
            description: `You don't have enough ${selectedToken.symbol} tokens`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid numeric amount",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);

    try {
      writeApprove({
        address: selectedToken.address,
        abi: ERC20,
        functionName: "approve",
        args: [selectedPool.gaugeAddress, amountWei],
      });

      toast({
        title: "Approval transaction submitted",
        description: "Please wait for the approval to complete before proceeding to step 2",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Failed to submit approval transaction",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeposit = async () => {
    if (!selectedPool || !selectedToken || !rewardAmount) return;

    // Check if user has sufficient balance
    if (tokenBalance !== undefined) {
      try {
        const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
        if (amountWei > tokenBalance) {
          toast({
            title: "Insufficient balance",
            description: `You don't have enough ${selectedToken.symbol} tokens`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid numeric amount",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);

    try {
      writeDeposit({
        address: selectedPool.gaugeAddress as `0x${string}`,
        abi: gaugeABI,
        functionName: "deposit_reward_token",
        args: [selectedToken.address, amountWei],
      });

      toast({
        title: "Deposit transaction submitted",
        description: "Your reward tokens are being deposited",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Deposit failed",
        description: "Failed to submit deposit transaction",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Watch for approval success to move to step 2
  React.useEffect(() => {
    if (approveSuccess && currentStep === 1) {
      setCurrentStep(2);
      refetchAllowance(); // Refresh allowance data
      toast({
        title: "Approval successful!",
        description: "You can now proceed to deposit the reward tokens",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [approveSuccess, currentStep]);

  // Watch for deposit success to close modal
  React.useEffect(() => {
    if (depositSuccess && currentStep === 2) {
      toast({
        title: "Rewards added successfully!",
        description: "Your reward tokens have been deposited to the gauge",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      refetchBalance(); // Refresh balance data
      closeAddRewardsModal();
      refetch(); // Refresh the data
    }
  }, [depositSuccess, currentStep]);

  // Function to check if pool has active rewards
  const hasActiveRewards = (pool: RewardTokenData) => {
    return pool.rewardTokens.some(token => {
      const rate = parseFloat(token.rate);
      const periodFinish = parseInt(token.period_finish);
      const currentTime = Math.floor(Date.now() / 1000);

      // Active if rate > 0 and period hasn't finished
      return rate > 0 && (periodFinish === 0 || periodFinish > currentTime);
    });
  };

  // Filter and search logic
  // Just use filtered data without sorting
  const sortedData = useMemo(() => {
    if (!data) return [];

    return data.filter(pool => {
      const matchesSearch =
        searchTerm === "" ||
        pool.poolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.poolSymbol.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesActiveFilter = !showActiveOnly || hasActiveRewards(pool);
      const matchesDistributorFilter = !showDistributorOnly || isDistributorForPool(pool);

      return matchesSearch && matchesActiveFilter && matchesDistributorFilter;
    });
  }, [data, searchTerm, showActiveOnly, showDistributorOnly, address]);

  const getExplorerUrl = (address: string) => {
    const explorers: { [key: string]: string } = {
      mainnet: "https://etherscan.io/address/",
      polygon: "https://polygonscan.com/address/",
      arbitrum: "https://arbiscan.io/address/",
      optimism: "https://optimistic.etherscan.io/address/",
      gnosis: "https://gnosisscan.io/address/",
      avalanche: "https://snowtrace.io/address/",
      base: "https://basescan.org/address/",
      sonic: "https://sonicscan.org/address/",
    };
    return explorers[selectedNetwork.toLowerCase()] || explorers["mainnet"];
  };

  // Show network selector first if no network is selected
  if (!selectedNetwork) {
    return (
      <VStack spacing={4} align="start">
        <Box maxW="300px">
          <NetworkSelector
            networks={networks}
            networkOptions={NETWORK_OPTIONS}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </Box>
      </VStack>
    );
  }

  if (loading) {
    return (
      <Box>
        <HStack spacing={4} mb={6} alignItems="end">
          <Box maxW="300px">
            <NetworkSelector
              networks={networks}
              networkOptions={NETWORK_OPTIONS}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </Box>
          <Button onClick={() => refetch()}>Refresh</Button>
        </HStack>

        <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading reward token data for {selectedNetwork}...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <HStack spacing={4} mb={6} alignItems="end">
          <Box maxW="300px">
            <NetworkSelector
              networks={networks}
              networkOptions={NETWORK_OPTIONS}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </Box>
          <Button onClick={() => refetch()}>Refresh</Button>
        </HStack>

        <Alert status="error">
          <AlertIcon />
          Error loading reward token data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <HStack spacing={4} mb={6} alignItems="end">
        <Box maxW="300px">
          <NetworkSelector
            networks={networks}
            networkOptions={NETWORK_OPTIONS}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </Box>
        <Button onClick={() => refetch()}>Refresh</Button>
      </HStack>

      <VStack spacing={4} mb={6}>
        <VStack spacing={3} width="100%" align="start">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Search pools by name or symbol..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <HStack spacing={6}>
            <Checkbox
              isChecked={showActiveOnly}
              onChange={e => setShowActiveOnly(e.target.checked)}
              colorScheme="green"
            >
              Pools with active rewards
            </Checkbox>
            <Checkbox
              isChecked={showDistributorOnly}
              onChange={e => setShowDistributorOnly(e.target.checked)}
              colorScheme="blue"
              isDisabled={!address}
            >
              Pools with connected wallet as distributor
            </Checkbox>
          </HStack>
        </VStack>
      </VStack>

      <RewardTokensTable
        data={sortedData || []}
        selectedNetwork={selectedNetwork}
        tokenLogos={tokenLogos}
        injectorAddresses={injectorAddresses}
        v2InjectorAddresses={v2InjectorAddresses}
        isRewardInjector={isRewardInjector}
        isDistributor={isDistributor}
        onAddRewards={openAddRewardsModal}
        getExplorerUrl={getExplorerUrl}
        formatEndDate={formatEndDate}
      />

      {(!sortedData || sortedData.length === 0) && (
        <Box textAlign="center" py={8}>
          <Text color="font.secondary">
            {searchTerm || showActiveOnly || showDistributorOnly
              ? `No pools found${searchTerm ? ` matching "${searchTerm}"` : ""}${showActiveOnly ? " with active rewards" : ""}${showDistributorOnly ? " where you're a distributor" : ""} on ${selectedNetwork}`
              : `No pools with gauges found for ${selectedNetwork}`}
          </Text>
        </Box>
      )}

      {/* Add Rewards Modal */}
      <Modal isOpen={isOpen} onClose={closeAddRewardsModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Rewards</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPool && selectedToken && (
              <VStack spacing={6} align="start">
                {/* Step Indicator */}
                <Box width="100%">
                  <Stepper index={currentStep - 1} colorScheme="green">
                    <Step>
                      <StepIndicator>
                        <StepStatus
                          complete={
                            shouldSkipApproval ? (
                              <StepIcon />
                            ) : currentStep > 1 ? (
                              <StepIcon />
                            ) : (
                              <StepNumber />
                            )
                          }
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>
                          {shouldSkipApproval
                            ? "✓ Approval Sufficient"
                            : tokenAllowance !== undefined && tokenAllowance > BigInt(0)
                              ? "Re-approve Tokens"
                              : "Approve Tokens"}
                        </StepTitle>
                        <StepDescription>
                          {shouldSkipApproval
                            ? "Allowance already covers amount"
                            : tokenAllowance !== undefined && tokenAllowance > BigInt(0)
                              ? "Increase allowance for this amount"
                              : "Allow gauge to spend tokens"}
                        </StepDescription>
                      </Box>
                      <StepSeparator />
                    </Step>

                    <Step>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepIcon />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>Deposit Rewards</StepTitle>
                        <StepDescription>Add tokens to gauge</StepDescription>
                      </Box>
                    </Step>
                  </Stepper>
                </Box>

                {/* Pool and Token Info */}
                <HStack spacing={8} width="100%">
                  <VStack align="start" spacing={2}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Pool: {selectedPool.poolName}
                      </Text>
                      <Text fontSize="xs" color="font.secondary">
                        {selectedPool.poolSymbol}
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Token: {selectedToken.symbol}
                      </Text>
                      <Text fontSize="xs" color="font.secondary">
                        {selectedToken.name}
                      </Text>
                    </Box>
                  </VStack>

                  <VStack align="start" spacing={2}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Current Rate:
                      </Text>
                      <Text fontSize="xs" color="font.secondary">
                        {parseFloat(selectedToken.rate).toFixed(6)} {selectedToken.symbol}/sec
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        End Date:
                      </Text>
                      <Text fontSize="xs" color="font.secondary">
                        {formatEndDate(selectedToken.period_finish)}
                      </Text>
                    </Box>
                  </VStack>
                </HStack>

                <Divider />

                {/* Distribution Info */}
                <Alert status="info" variant="left-accent">
                  <AlertIcon />
                  <AlertDescription>
                    <Text fontSize="sm">Rewards are distributed over the next 7 days.</Text>
                  </AlertDescription>
                </Alert>

                {/* Amount Input */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">
                    Amount to add:
                  </FormLabel>
                  <HStack spacing={2}>
                    <Input
                      value={rewardAmount}
                      onChange={e => setRewardAmount(e.target.value)}
                      placeholder="0.0"
                      type="number"
                      min="0"
                      step="any"
                      size="lg"
                      borderColor={(() => {
                        if (!rewardAmount || !tokenBalance) return "gray.300";
                        try {
                          const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                          return amountWei > tokenBalance ? "red.300" : "gray.300";
                        } catch {
                          return "red.300";
                        }
                      })()}
                      _focus={{
                        borderColor: (() => {
                          if (!rewardAmount || !tokenBalance) return "blue.500";
                          try {
                            const amountWei = ethers.parseUnits(
                              rewardAmount,
                              selectedToken.decimals,
                            );
                            return amountWei > tokenBalance ? "red.500" : "blue.500";
                          } catch {
                            return "red.500";
                          }
                        })(),
                        boxShadow: (() => {
                          if (!rewardAmount || !tokenBalance) return "0 0 0 1px #3182ce";
                          try {
                            const amountWei = ethers.parseUnits(
                              rewardAmount,
                              selectedToken.decimals,
                            );
                            return amountWei > tokenBalance
                              ? "0 0 0 1px #e53e3e"
                              : "0 0 0 1px #3182ce";
                          } catch {
                            return "0 0 0 1px #e53e3e";
                          }
                        })(),
                      }}
                      _hover={{
                        borderColor: (() => {
                          if (!rewardAmount || !tokenBalance) return "gray.400";
                          try {
                            const amountWei = ethers.parseUnits(
                              rewardAmount,
                              selectedToken.decimals,
                            );
                            return amountWei > tokenBalance ? "red.400" : "gray.400";
                          } catch {
                            return "red.400";
                          }
                        })(),
                      }}
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => {
                        if (tokenBalance !== undefined) {
                          setRewardAmount(formatTokenBalance(tokenBalance, selectedToken.decimals));
                        }
                      }}
                      isDisabled={tokenBalance === undefined || tokenBalance === BigInt(0)}
                    >
                      Max
                    </Button>
                  </HStack>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="xs" color="font.secondary">
                      Wallet Balance:
                    </Text>
                    {tokenBalance !== undefined ? (
                      <Text fontSize="xs" color="font.secondary" fontWeight="medium">
                        {formatTokenBalance(tokenBalance, selectedToken.decimals)}{" "}
                        {selectedToken.symbol}
                      </Text>
                    ) : (
                      <Skeleton height="16px" width="80px" />
                    )}
                  </HStack>
                  {rewardAmount && tokenBalance !== undefined && (
                    <Text
                      fontSize="xs"
                      color={(() => {
                        try {
                          const amountBig = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                          return amountBig > tokenBalance ? "red.500" : "font.secondary";
                        } catch {
                          return "red.500";
                        }
                      })()}
                      mt={1}
                    >
                      {(() => {
                        try {
                          const amountBig = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                          const balanceBig = tokenBalance;
                          if (amountBig > balanceBig) {
                            return "⚠️ Amount exceeds your balance";
                          }
                          return "";
                        } catch {
                          return "⚠️ Invalid amount";
                        }
                      })()}
                    </Text>
                  )}
                </FormControl>

                {/* Step-specific instructions */}
                {currentStep === 1 && !shouldSkipApproval && (
                  <Alert status="info" variant="subtle">
                    <AlertIcon />
                    <AlertDescription>
                      <Text fontWeight="bold" mb={2}>
                        Step 1: Approve Tokens
                      </Text>
                      <Text>
                        {tokenAllowance !== undefined && tokenAllowance > BigInt(0)
                          ? `You need to approve the gauge to spend ${rewardAmount || "0"} ${selectedToken.symbol} tokens. Your current allowance of ${formatTokenBalance(tokenAllowance, selectedToken.decimals)} ${selectedToken.symbol} is insufficient for this amount.`
                          : `You need to approve the gauge to spend ${rewardAmount || "0"} ${selectedToken.symbol} tokens from your wallet before depositing them as rewards.`}
                      </Text>
                    </AlertDescription>
                  </Alert>
                )}

                {currentStep === 1 && shouldSkipApproval && (
                  <Alert status="success" variant="subtle">
                    <AlertIcon />
                    <AlertDescription>
                      <Text fontWeight="bold" mb={2}>
                        ✓ Approval Already Sufficient
                      </Text>
                      <Text>
                        Your current allowance covers this amount. You can proceed directly to
                        deposit the rewards.
                      </Text>
                    </AlertDescription>
                  </Alert>
                )}

                {currentStep === 2 && (
                  <Alert status="success" variant="subtle">
                    <AlertIcon />
                    <AlertDescription>
                      <Text fontWeight="bold" mb={2}>
                        Step 2: Deposit Rewards
                      </Text>
                      <Text>
                        {shouldSkipApproval
                          ? `Ready to deposit ${rewardAmount} ${selectedToken.symbol} tokens as rewards to the gauge.`
                          : `Approval complete! Now you can deposit the ${rewardAmount} ${selectedToken.symbol} tokens as rewards to the gauge.`}
                      </Text>
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAddRewardsModal}>
              Cancel
            </Button>

            {currentStep === 1 && !shouldSkipApproval && (
              <Button
                colorScheme="blue"
                onClick={handleApprove}
                isLoading={isApproving}
                loadingText="Approving..."
                isDisabled={
                  !rewardAmount ||
                  parseFloat(rewardAmount) <= 0 ||
                  (() => {
                    if (!tokenBalance) return false;
                    try {
                      const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                      return amountWei > tokenBalance;
                    } catch {
                      return true;
                    }
                  })()
                }
                size="lg"
              >
                Approve Tokens
              </Button>
            )}

            {currentStep === 1 && shouldSkipApproval && (
              <Button
                colorScheme="green"
                onClick={() => setCurrentStep(2)}
                isDisabled={
                  !rewardAmount ||
                  parseFloat(rewardAmount) <= 0 ||
                  (() => {
                    if (!tokenBalance) return false;
                    try {
                      const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                      return amountWei > tokenBalance;
                    } catch {
                      return true;
                    }
                  })()
                }
                size="lg"
              >
                Proceed to Deposit
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                colorScheme="green"
                onClick={handleDeposit}
                isLoading={isDepositing}
                loadingText="Depositing..."
                isDisabled={(() => {
                  if (!tokenBalance) return false;
                  try {
                    const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                    return amountWei > tokenBalance;
                  } catch {
                    return true;
                  }
                })()}
                size="lg"
              >
                Deposit Rewards
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RewardTokensOverview;
