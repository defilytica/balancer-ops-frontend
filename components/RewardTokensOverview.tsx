import React, { useState, useEffect, useMemo } from "react";
import NextLink from "next/link";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Link,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  VStack,
  HStack,
  Button,
  TableContainer,
  Wrap,
  WrapItem,
  Select,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  useToast,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Divider,
  Flex,
  Skeleton,
  Avatar,
} from "@chakra-ui/react";
import { ExternalLinkIcon, SearchIcon } from "@chakra-ui/icons";
import { NetworkSelector } from "@/components/NetworkSelector";
import { useRewardTokenData } from "@/lib/hooks/useRewardTokenData";
import { RewardTokenData } from "@/types/rewardTokenTypes";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ethers } from "ethers";
import { gaugeABI } from "@/abi/gauge";
import { ERC20 } from "@/abi/erc20";
import { useQuery } from "@apollo/client";
import { GetTokensDocument, GetTokensQuery, GetTokensQueryVariables } from "@/lib/services/apollo/generated/graphql";

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
  const { data: tokenData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
    GetTokensDocument,
    {
      variables: {
        chainIn: [selectedNetwork as any],
        tokensIn: tokenAddresses,
      },
      skip: !selectedNetwork || tokenAddresses.length === 0,
    }
  );

  // Create a map of token address to logoURI for quick lookup
  const tokenLogos = useMemo(() => {
    if (!tokenData) return {};
    const logoMap: { [address: string]: string } = {};
    tokenData.tokenGetTokens.forEach(token => {
      logoMap[token.address.toLowerCase()] = token.logoURI || '';
    });
    return logoMap;
  }, [tokenData]);

  // Fetch injector addresses when component mounts
  useEffect(() => {
    const fetchInjectorAddresses = async () => {
      try {
        // Fetch both V1 and V2 injectors
        const [v1Response, v2Response] = await Promise.all([
          fetch('/api/injector/v1/all'),
          fetch('/api/injector/v2/all')
        ]);

        const addresses = new Set<string>();
        
        if (v1Response.ok) {
          const v1Data = await v1Response.json();
          v1Data.forEach((injector: any) => {
            addresses.add(injector.address.toLowerCase());
          });
        }

        if (v2Response.ok) {
          const v2Data = await v2Response.json();
          v2Data.forEach((injector: any) => {
            addresses.add(injector.address.toLowerCase());
          });
        }

        setInjectorAddresses(addresses);
      } catch (error) {
        console.error('Error fetching injector addresses:', error);
      }
    };

    fetchInjectorAddresses();
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

  const isDistributor = (tokenDistributor: string) => {
    return address && address.toLowerCase() === tokenDistributor.toLowerCase();
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
        address: selectedPool.gaugeAddress,
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
  const filteredAndSearchedData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(pool => {
      const matchesSearch = searchTerm === "" || 
        pool.poolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.poolSymbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesActiveFilter = !showActiveOnly || hasActiveRewards(pool);
      const matchesDistributorFilter = !showDistributorOnly || isDistributorForPool(pool);
      
      return matchesSearch && matchesActiveFilter && matchesDistributorFilter;
    });
  }, [data, searchTerm, showActiveOnly, showDistributorOnly, address]);

  // Just use filtered data without sorting
  const sortedData = filteredAndSearchedData;

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
      <Card>
        <CardHeader>
          <Heading size="md">Select Network</Heading>
        </CardHeader>
        <CardBody>
          <Text mb={4}>Please select a network to view reward tokens for pools and gauges.</Text>
          <Box maxW="300px">
            <NetworkSelector
              networks={networks}
              networkOptions={NETWORK_OPTIONS}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </Box>
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Box>
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Reward Tokens Management</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%" alignItems="end">
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
            </VStack>
          </CardBody>
        </Card>
        
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
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Reward Tokens Management</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%" alignItems="end">
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
            </VStack>
          </CardBody>
        </Card>
        
        <Alert status="error">
          <AlertIcon />
          Error loading reward token data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Reward Tokens Management</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <HStack spacing={4} width="100%" alignItems="end">
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
          </VStack>
        </CardBody>
      </Card>
      
      <VStack spacing={4} mb={6}>
        <VStack spacing={3} width="100%" align="start">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Search pools by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <HStack spacing={6}>
            <Checkbox
              isChecked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              colorScheme="green"
            >
              Show only pools with active rewards
            </Checkbox>
            <Checkbox
              isChecked={showDistributorOnly}
              onChange={(e) => setShowDistributorOnly(e.target.checked)}
              colorScheme="blue"
              isDisabled={!address}
            >
              Show only pools where I'm a distributor
            </Checkbox>
          </HStack>
        </VStack>
      </VStack>

      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Pool Name</Th>
              <Th>Pool Address</Th>
              <Th>Gauge Address</Th>
              <Th>Reward Tokens & Rates</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedData?.map((pool) => (
              <Tr key={pool.poolAddress}>
                <Td>
                  <Text fontWeight="medium">{pool.poolName}</Text>
                  <Text fontSize="sm" color="font.secondary">
                    {pool.poolSymbol}
                  </Text>
                </Td>
                <Td>
                  <Link
                    href={`${getExplorerUrl(pool.poolAddress)}${pool.poolAddress}`}
                    isExternal
                    color="blue.500"
                  >
                    {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}
                    <ExternalLinkIcon mx="2px" />
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={`${getExplorerUrl(pool.gaugeAddress)}${pool.gaugeAddress}`}
                    isExternal
                    color="blue.500"
                  >
                    {pool.gaugeAddress.slice(0, 6)}...{pool.gaugeAddress.slice(-4)}
                    <ExternalLinkIcon mx="2px" />
                  </Link>
                </Td>
                <Td>
                  {pool.rewardTokens.length === 0 ? (
                    <Text fontSize="sm" color="font.secondary">
                      No reward tokens
                    </Text>
                  ) : (
                    <Wrap spacing={2}>
                      {pool.rewardTokens.map((token, index) => {
                        const rate = parseFloat(token.rate);
                        const periodFinish = parseInt(token.period_finish);
                        const currentTime = Math.floor(Date.now() / 1000);
                        const isActive = rate > 0 && (periodFinish === 0 || periodFinish > currentTime);
                        const isUserDistributor = isDistributor(token.distributor);
                        
                        return (
                          <WrapItem key={index}>
                            <VStack spacing={1} align="start" p={2} border="1px" borderColor="gray.200" borderRadius="md">
                              <HStack spacing={2}>
                                <Avatar
                                  src={tokenLogos[token.address.toLowerCase()]}
                                  name={token.symbol}
                                  size="xs"
                                  bg="transparent"
                                  border="none"
                                  _before={{
                                    content: '""',
                                    display: "none",
                                  }}
                                />
                                <HStack spacing={1}>
                                  <Link
                                    href={`${getExplorerUrl(token.address)}${token.address}`}
                                    isExternal
                                    color="blue.500"
                                    fontSize="sm"
                                    fontWeight="medium"
                                  >
                                    {token.symbol}
                                    <ExternalLinkIcon mx="2px" />
                                  </Link>
                                  <Badge
                                    size="sm"
                                    colorScheme={isActive ? "green" : "gray"}
                                    variant="subtle"
                                  >
                                    {isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </HStack>
                              </HStack>
                              <Text fontSize="xs" color="font.secondary">
                                {isActive ? `${parseFloat(token.rate).toFixed(6)} ${token.symbol}/sec` : "0 /sec"}
                              </Text>
                              <Text fontSize="xs" color="font.secondary">
                                End: {formatEndDate(token.period_finish)}
                              </Text>
                              <HStack spacing={1}>
                                <Text fontSize="xs" color="font.secondary">
                                  Distributor:
                                </Text>
                                <HStack spacing={1}>
                                  <Link
                                    href={`${getExplorerUrl(token.distributor)}${token.distributor}`}
                                    isExternal
                                    color="blue.500"
                                    fontSize="xs"
                                  >
                                    {token.distributor.slice(0, 6)}...{token.distributor.slice(-4)}
                                    <ExternalLinkIcon mx="2px" />
                                  </Link>
                                  {isRewardInjector(token.distributor) && (
                                    <NextLink
                                      href={`/rewards-injector/${selectedNetwork.toLowerCase()}/${token.distributor}`}
                                      passHref
                                    >
                                      <Link
                                        color="green.500"
                                        fontSize="xs"
                                        fontWeight="medium"
                                        textDecoration="underline"
                                      >
                                        (Injector)
                                      </Link>
                                    </NextLink>
                                  )}
                                </HStack>
                              </HStack>
                              
                              {isUserDistributor && (
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  onClick={() => openAddRewardsModal(pool, token)}
                                  mt={2}
                                >
                                  Add Rewards
                                </Button>
                              )}
                            </VStack>
                          </WrapItem>
                        );
                      })}
                    </Wrap>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {(!sortedData || sortedData.length === 0) && (
        <Box textAlign="center" py={8}>
          <Text color="font.secondary">
            {searchTerm || showActiveOnly || showDistributorOnly
              ? `No pools found${searchTerm ? ` matching "${searchTerm}"` : ""}${showActiveOnly ? " with active rewards" : ""}${showDistributorOnly ? " where you're a distributor" : ""} on ${selectedNetwork}`
              : `No pools with gauges found for ${selectedNetwork}`
            }
          </Text>
        </Box>
      )}


      {/* Add Rewards Modal */}
      <Modal isOpen={isOpen} onClose={closeAddRewardsModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Add Rewards
          </ModalHeader>
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
                          complete={shouldSkipApproval ? <StepIcon /> : currentStep > 1 ? <StepIcon /> : <StepNumber />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>
                          {shouldSkipApproval ? "✓ Approval Sufficient" : 
                           (tokenAllowance !== undefined && tokenAllowance > 0n ? "Re-approve Tokens" : "Approve Tokens")}
                        </StepTitle>
                        <StepDescription>
                          {shouldSkipApproval ? "Allowance already covers amount" : 
                           (tokenAllowance !== undefined && tokenAllowance > 0n ? "Increase allowance for this amount" : "Allow gauge to spend tokens")}
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

                {/* Amount Input */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">
                    Amount to add:
                  </FormLabel>
                  <HStack spacing={2}>
                    <Input
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
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
                            const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                            return amountWei > tokenBalance ? "red.500" : "blue.500";
                          } catch {
                            return "red.500";
                          }
                        })(),
                        boxShadow: (() => {
                          if (!rewardAmount || !tokenBalance) return "0 0 0 1px #3182ce";
                          try {
                            const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
                            return amountWei > tokenBalance ? "0 0 0 1px #e53e3e" : "0 0 0 1px #3182ce";
                          } catch {
                            return "0 0 0 1px #e53e3e";
                          }
                        })(),
                      }}
                      _hover={{
                        borderColor: (() => {
                          if (!rewardAmount || !tokenBalance) return "gray.400";
                          try {
                            const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
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
                      isDisabled={tokenBalance === undefined || tokenBalance === 0n}
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
                        {formatTokenBalance(tokenBalance, selectedToken.decimals)} {selectedToken.symbol}
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
                        {tokenAllowance !== undefined && tokenAllowance > 0n ? 
                          `You need to approve the gauge to spend ${rewardAmount || "0"} ${selectedToken.symbol} tokens. Your current allowance of ${formatTokenBalance(tokenAllowance, selectedToken.decimals)} ${selectedToken.symbol} is insufficient for this amount.` :
                          `You need to approve the gauge to spend ${rewardAmount || "0"} ${selectedToken.symbol} tokens from your wallet before depositing them as rewards.`
                        }
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
                        Your current allowance covers this amount. You can proceed directly to deposit the rewards.
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
                        {shouldSkipApproval ? 
                          `Ready to deposit ${rewardAmount} ${selectedToken.symbol} tokens as rewards to the gauge.` :
                          `Approval complete! Now you can deposit the ${rewardAmount} ${selectedToken.symbol} tokens as rewards to the gauge.`
                        }
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
                isDisabled={
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