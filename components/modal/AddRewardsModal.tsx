import React, { useState, useEffect } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
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
  VStack,
  Grid,
  GridItem,
  IconButton,
  Tooltip,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { ethers } from "ethers";
import { gaugeABI } from "@/abi/gauge";
import { ERC20 } from "@/abi/erc20";
import { RewardTokenData } from "@/types/rewardTokenTypes";

interface AddRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPool: RewardTokenData | null;
  selectedToken: any;
  selectedNetwork: string;
  formatEndDate: (periodFinish: string) => string;
  onSuccess: () => void;
  isDistributor: (address: string) => boolean;
}

const AddRewardsModal: React.FC<AddRewardsModalProps> = ({
  isOpen,
  onClose,
  selectedPool,
  selectedToken,
  selectedNetwork,
  formatEndDate,
  onSuccess,
  isDistributor,
}) => {
  const [rewardAmount, setRewardAmount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [shouldSkipApproval, setShouldSkipApproval] = useState<boolean>(false);
  const [isTransactionInProgress, setIsTransactionInProgress] = useState<boolean>(false);

  const { address } = useAccount();
  const chainId = useChainId();
  const toast = useToast();

  // Generate share link for this specific modal
  const getShareLink = () => {
    if (!selectedNetwork || !selectedPool || !selectedToken) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      network: selectedNetwork,
      gauge: selectedPool.gaugeAddress,
      token: selectedToken.address,
    });
    return `${baseUrl}/reward-tokens?${params.toString()}`;
  };

  const shareLink = getShareLink();
  const { onCopy: onCopyShareLink, hasCopied: hasShareLinkCopied } = useClipboard(shareLink);

  const handleCopyShareLink = () => {
    onCopyShareLink();
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Helper function to get expected chain ID for network
  const getExpectedChainId = (network: string) => {
    const chainIds: { [key: string]: number } = {
      mainnet: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      gnosis: 100,
      avalanche: 43114,
      base: 8453,
      sonic: 146,
    };
    return chainIds[network.toLowerCase()];
  };

  // Check if user is on correct network
  const isCorrectNetwork = selectedNetwork
    ? chainId === getExpectedChainId(selectedNetwork)
    : false;

  // Check if connected wallet is the distributor
  const isUserDistributor =
    selectedToken?.distributor && address ? isDistributor(selectedToken.distributor) : false;

  // Read token balance
  const {
    data: tokenBalance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: ERC20,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!(selectedToken?.address && address && isCorrectNetwork),
    },
  }) as {
    data: bigint | undefined;
    refetch: () => void;
    isLoading: boolean;
    error: Error | null;
  };

  // Read token allowance
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: ERC20,
    functionName: "allowance",
    args: [address as `0x${string}`, selectedPool?.gaugeAddress as `0x${string}`],
    query: {
      enabled: !!(
        selectedToken?.address &&
        address &&
        selectedPool?.gaugeAddress &&
        isCorrectNetwork
      ),
    },
  }) as { data: bigint | undefined; refetch: () => void };

  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveWriteError,
    isError: approveWriteIsError,
    reset: resetApprove,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositHash,
    error: depositWriteError,
    isError: depositWriteIsError,
    reset: resetDeposit,
  } = useWriteContract();

  const {
    isLoading: isApproving,
    isSuccess: approveSuccess,
    isError: approveError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    isLoading: isDepositing,
    isSuccess: depositSuccess,
    isError: depositError,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

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

  // Watch for approval write errors (user rejection)
  useEffect(() => {
    if (approveWriteError) {
      console.error("Approval write error:", approveWriteError);
      setIsTransactionInProgress(false);
      // Reset the write contract state to allow retry
      resetApprove();

      // Show user-friendly error message
      if (
        approveWriteError.message?.includes("User rejected") ||
        approveWriteError.message?.includes("User denied")
      ) {
        toast({
          title: "Transaction cancelled",
          description: "You cancelled the approval transaction",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [approveWriteError, resetApprove, toast]);

  // Watch for deposit write errors (user rejection)
  useEffect(() => {
    if (depositWriteError) {
      console.error("Deposit write error:", depositWriteError);
      setIsTransactionInProgress(false);
      // Reset the write contract state to allow retry
      resetDeposit();

      // Show user-friendly error message
      if (
        depositWriteError.message?.includes("User rejected") ||
        depositWriteError.message?.includes("User denied")
      ) {
        toast({
          title: "Transaction cancelled",
          description: "You cancelled the deposit transaction",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [depositWriteError, resetDeposit, toast]);

  // Watch for approval success to move to step 2
  useEffect(() => {
    let mounted = true;

    if (approveSuccess && currentStep === 1 && mounted) {
      setCurrentStep(2);
      refetchAllowance();
      // Clear the transaction in progress flag after moving to next step
      setIsTransactionInProgress(false);
    }

    // Reset transaction progress if approval fails on-chain
    if (approveError && mounted) {
      setIsTransactionInProgress(false);
      toast({
        title: "Approval failed",
        description: "The approval transaction failed. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    return () => {
      mounted = false;
    };
  }, [approveSuccess, approveError, currentStep, refetchAllowance, toast]);

  // Watch for deposit success to close modal
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    if (depositSuccess && currentStep === 2 && mounted) {
      refetchBalance();
      onSuccess();
      setIsTransactionInProgress(false);
      // Add a small delay to ensure state updates complete before closing
      timeoutId = setTimeout(() => {
        if (mounted) {
          handleClose();
        }
      }, 100);
    }

    // Reset transaction progress if deposit fails on-chain
    if (depositError && mounted) {
      setIsTransactionInProgress(false);
      toast({
        title: "Deposit failed",
        description: "The deposit transaction failed. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [depositSuccess, depositError, currentStep, refetchBalance, onSuccess, toast]);

  const handleClose = () => {
    // Don't close if a transaction is in progress
    if (isTransactionInProgress) {
      return;
    }
    setRewardAmount("");
    setCurrentStep(1);
    setShouldSkipApproval(false);
    setIsTransactionInProgress(false);
    // Reset write contract states
    resetApprove();
    resetDeposit();
    onClose();
  };

  const handleApprove = async () => {
    if (!selectedPool || !selectedToken || !rewardAmount || parseFloat(rewardAmount) <= 0) {
      return;
    }

    // Check if user has sufficient balance
    if (tokenBalance !== undefined) {
      try {
        const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
        if (amountWei > tokenBalance) {
          return;
        }
      } catch {
        return;
      }
    }

    const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);

    try {
      setIsTransactionInProgress(true);
      writeApprove({
        address: selectedToken.address,
        abi: ERC20,
        functionName: "approve",
        args: [selectedPool.gaugeAddress, amountWei],
      });
    } catch (error) {
      console.error("Approval failed:", error);
      setIsTransactionInProgress(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedPool || !selectedToken || !rewardAmount) return;

    // Check if user has sufficient balance
    if (tokenBalance !== undefined) {
      try {
        const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);
        if (amountWei > tokenBalance) {
          return;
        }
      } catch {
        return;
      }
    }

    const amountWei = ethers.parseUnits(rewardAmount, selectedToken.decimals);

    try {
      setIsTransactionInProgress(true);
      writeDeposit({
        address: selectedPool.gaugeAddress as `0x${string}`,
        abi: gaugeABI,
        functionName: "deposit_reward_token",
        args: [selectedToken.address, amountWei],
      });
    } catch (error) {
      console.error("Deposit failed:", error);
      setIsTransactionInProgress(false);
    }
  };

  if (!selectedPool || !selectedToken) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: "lg", md: "2xl", lg: "4xl" }}
      closeOnOverlayClick={!isTransactionInProgress}
      closeOnEsc={!isTransactionInProgress}
    >
      <ModalOverlay />
      <ModalContent maxW={{ base: "90vw", md: "2xl", lg: "4xl" }}>
        <ModalHeader>
          <HStack justify="space-between" pr={8}>
            <Text>Add Rewards</Text>
            <HStack spacing={2}>
              <Tooltip label={hasShareLinkCopied ? "Copied!" : "Copy share link"} hasArrow>
                <IconButton
                  aria-label="Copy share link"
                  icon={<CopyIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyShareLink}
                  color={hasShareLinkCopied ? "green.500" : "gray.500"}
                />
              </Tooltip>
              <Tooltip label="Open in new tab" hasArrow>
                <IconButton
                  aria-label="Open share link"
                  icon={<ExternalLinkIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(shareLink, "_blank")}
                  color="gray.500"
                />
              </Tooltip>
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="start">
            {/* Step Indicator */}
            <Box width="100%">
              <Stepper index={currentStep - 1} colorScheme="green" size="md">
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

            {/* Pool and Token Info - Responsive Grid */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} width="100%">
              <GridItem>
                <VStack align="start" spacing={3}>
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
              </GridItem>

              <GridItem>
                <VStack align="start" spacing={3}>
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
              </GridItem>
            </Grid>

            <Divider />

            {/* Network Check */}
            {!isCorrectNetwork && (
              <Alert status="warning" variant="left-accent">
                <AlertIcon />
                <AlertDescription>
                  <Text fontSize="sm" fontWeight="bold">
                    Wrong Network
                  </Text>
                  <Text fontSize="sm">
                    Please switch to {selectedNetwork} network (Chain ID:{" "}
                    {getExpectedChainId(selectedNetwork)}) to load balance and perform transactions.
                    Currently connected to Chain ID: {chainId}
                  </Text>
                </AlertDescription>
              </Alert>
            )}

            {/* Distributor Check */}
            {!isUserDistributor && address && (
              <Alert status="error" variant="left-accent">
                <AlertIcon />
                <AlertDescription>
                  <Text fontSize="sm" fontWeight="bold">
                    You are not the distributor of this token
                  </Text>
                  <Text fontSize="sm">
                    Only the distributor ({selectedToken?.distributor?.slice(0, 8)}...
                    {selectedToken?.distributor?.slice(-6)}) can add rewards for this token.
                  </Text>
                </AlertDescription>
              </Alert>
            )}

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
                  onWheel={e => (e.target as HTMLInputElement).blur()}
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
                  isDisabled={
                    !isCorrectNetwork || tokenBalance === undefined || tokenBalance === BigInt(0)
                  }
                >
                  Max
                </Button>
              </HStack>

              {/* Balance Display */}
              <HStack justify="space-between" mt={1}>
                <Text fontSize="xs" color="font.secondary">
                  Wallet Balance:
                </Text>
                {!isCorrectNetwork ? (
                  <Text fontSize="xs" color="orange.500" fontWeight="medium">
                    Switch network
                  </Text>
                ) : isBalanceLoading ? (
                  <Skeleton height="16px" width="80px" />
                ) : tokenBalance !== undefined ? (
                  <Text fontSize="xs" color="font.secondary" fontWeight="medium">
                    {formatTokenBalance(tokenBalance, selectedToken.decimals)}{" "}
                    {selectedToken.symbol}
                  </Text>
                ) : balanceError ? (
                  <Text
                    fontSize="xs"
                    color="red.500"
                    fontWeight="medium"
                    title={balanceError.message}
                  >
                    Error loading balance
                  </Text>
                ) : (
                  <Text fontSize="xs" color="orange.500" fontWeight="medium">
                    Balance unavailable
                  </Text>
                )}
              </HStack>

              {/* Balance Validation */}
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
                      if (amountBig > tokenBalance) {
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
                    Your current allowance covers this amount. You can proceed directly to deposit
                    the rewards.
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
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isTransactionInProgress}>
            Cancel
          </Button>

          {currentStep === 1 && !shouldSkipApproval && (
            <Button
              colorScheme="blue"
              onClick={handleApprove}
              isLoading={
                isApproving || (isTransactionInProgress && currentStep === 1 && !approveWriteError)
              }
              loadingText="Approving..."
              isDisabled={
                !isCorrectNetwork ||
                !isUserDistributor ||
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
              {!isUserDistributor ? "Not Distributor" : "Approve Tokens"}
            </Button>
          )}

          {currentStep === 1 && shouldSkipApproval && (
            <Button
              colorScheme="green"
              onClick={() => setCurrentStep(2)}
              isDisabled={
                !isCorrectNetwork ||
                !isUserDistributor ||
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
              {!isUserDistributor ? "Not Distributor" : "Proceed to Deposit"}
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              colorScheme="green"
              onClick={handleDeposit}
              isLoading={
                isDepositing || (isTransactionInProgress && currentStep === 2 && !depositWriteError)
              }
              loadingText="Depositing..."
              isDisabled={
                !isCorrectNetwork ||
                !isUserDistributor ||
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
              {!isUserDistributor ? "Not Distributor" : "Deposit Rewards"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddRewardsModal;
