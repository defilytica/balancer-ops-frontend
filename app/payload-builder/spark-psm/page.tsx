"use client";
import React, { useState, useCallback, useMemo } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  handleDownloadClick,
  generateSparkPSMDepositPayload,
  generateSparkPSMWithdrawPayload,
} from "@/app/payload-builder/payloadHelperFunctions";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import OpenPRButton from "@/components/btns/OpenPRButton";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";
import ComposerButton from "@/app/payload-builder/composer/ComposerButton";
import ComposerIndicator from "@/app/payload-builder/composer/ComposerIndicator";
import { ethers } from "ethers";
import { ERC4626 } from "@/abi/erc4626";
import { isAddress } from "viem";
import { useReadContract } from "wagmi";
import { WHITELISTED_PAYMENT_TOKENS } from "@/constants/constants";

type OperationType = "deposit" | "withdraw";

const isValidAmount = (amount: string): boolean => {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export default function SparkPSMPage() {
  const [operationType, setOperationType] = useState<OperationType>("deposit");
  const [amountIn, setAmountIn] = useState<string>("");
  const [amountOut, setAmountOut] = useState<string>("");
  const [depositor, setDepositor] = useState<string>("");
  const [receiver, setReceiver] = useState<string>("");
  const [generatedPayload, setGeneratedPayload] = useState<string | null>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const [touched, setTouched] = useState<{
    amountIn: boolean;
    depositor: boolean;
    receiver: boolean;
  }>({
    amountIn: false,
    depositor: false,
    receiver: false,
  });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const SUSDS = WHITELISTED_PAYMENT_TOKENS["mainnet"].find(t => t.symbol === "sUSDS")!;
  const USDC = WHITELISTED_PAYMENT_TOKENS["mainnet"].find(t => t.symbol === "USDC")!;

  // Fetch current sUSDS exchange rate (how many assets 1 share is worth)
  // We use 1e18 as input to get the rate for 1 sUSDS share
  const ONE_SHARE = BigInt(10 ** SUSDS.decimals);
  const { data: assetsPerShare, isLoading: isRateLoading } = useReadContract({
    address: SUSDS.address as `0x${string}`,
    abi: ERC4626,
    functionName: "convertToAssets",
    args: [ONE_SHARE],
    chainId: 1,
  }) as { data: bigint | undefined; isLoading: boolean };

  // Calculate the exchange rate as a human-readable number
  const exchangeRate = useMemo(() => {
    if (!assetsPerShare) return null;
    // assetsPerShare is in 18 decimals (USDS decimals), divide by 1e18 to get rate
    return Number(assetsPerShare) / 1e18;
  }, [assetsPerShare]);

  // Fetch convertToShares for withdraw approval calculation
  const maxAmountInWei = useMemo(() => {
    if (!amountIn || operationType !== "withdraw") return BigInt(0);
    try {
      return ethers.parseUnits(amountIn, SUSDS.decimals);
    } catch {
      return BigInt(0);
    }
  }, [amountIn, operationType, SUSDS.decimals]);

  const { data: sharesForWithdraw } = useReadContract({
    address: SUSDS.address as `0x${string}`,
    abi: ERC4626,
    functionName: "convertToShares",
    args: [maxAmountInWei],
    chainId: 1,
    query: {
      enabled: operationType === "withdraw" && maxAmountInWei > BigInt(0),
    },
  }) as { data: bigint | undefined };

  // Validation state
  const errors = {
    amount:
      touched.amountIn && !isValidAmount(amountIn)
        ? "Please enter a valid amount greater than 0"
        : "",
    depositor:
      touched.depositor && !isAddress(depositor) ? "Please enter a valid Ethereum address" : "",
    receiver:
      touched.receiver && !isAddress(receiver) ? "Please enter a valid Ethereum address" : "",
  };

  const isFormValid = isValidAmount(amountIn) && isAddress(depositor) && isAddress(receiver);

  const generatePayload = () => {
    // Mark all fields as touched to show validation errors
    setTouched({ amountIn: true, depositor: true, receiver: true });

    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    let payload;
    let humanText: string;

    if (operationType === "deposit") {
      const amountInUnits = ethers.parseUnits(amountIn, USDC.decimals).toString();
      const minAmountOutUnits = ethers.parseUnits(amountOut || amountIn, SUSDS.decimals).toString();

      payload = generateSparkPSMDepositPayload({
        inTokenAddress: USDC.address,
        amountIn: amountInUnits,
        minAmountOut: minAmountOutUnits,
        receiver,
        depositor,
      });
      humanText = payload.meta.description;
    } else {
      // Use pre-fetched convertToShares value for approval amount
      const maxAmountInUnits = ethers.parseUnits(amountIn, SUSDS.decimals).toString();
      const amountOutUnits = ethers.parseUnits(amountOut || amountIn, USDC.decimals).toString();

      if (!sharesForWithdraw) {
        toast({
          title: "Error",
          description: "Failed to calculate sUSDS approval amount. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Add 1 to prevent rounding errors (per Spark docs)
      const approvalAmount = (BigInt(sharesForWithdraw) + BigInt(1)).toString();

      payload = generateSparkPSMWithdrawPayload({
        inTokenAddress: SUSDS.address,
        maxAmountIn: maxAmountInUnits,
        amountOut: amountOutUnits,
        receiver,
        depositor,
        approvalAmount,
      });
      humanText = payload.meta.description;
    }

    setGeneratedPayload(JSON.stringify(payload, null, 4));
    setHumanReadableText(humanText);
  };

  const generateComposerData = useCallback(() => {
    if (!generatedPayload) return null;

    const payload =
      typeof generatedPayload === "string" ? JSON.parse(generatedPayload) : generatedPayload;

    return {
      type: "spark-psm",
      title: `Spark PSM ${operationType === "deposit" ? "Deposit" : "Withdraw"} ${amountIn} USDC`,
      description: humanReadableText || `Spark PSM ${operationType} operation`,
      payload: payload,
      params: {
        operation: operationType,
        amountIn: amountIn,
        depositor: depositor,
        receiver: receiver,
      },
      builderPath: "spark-psm",
    };
  }, [generatedPayload, humanReadableText, operationType, amountIn, depositor, receiver]);

  const getPrefillValues = () => {
    if (!amountIn || !generatedPayload) return {};

    const uniqueId = generateUniqueId();
    const opText = operationType === "deposit" ? "deposit" : "withdraw";

    return {
      prefillBranchName: `feature/spark-psm-${opText}-${uniqueId}`,
      prefillPrName: `Spark PSM: ${operationType === "deposit" ? "Deposit" : "Withdraw"} ${amountIn} USDC`,
      prefillDescription: humanReadableText || "",
      prefillFilename: `spark-psm-${opText}-${uniqueId}.json`,
    };
  };

  const handleOpenPRModal = () => {
    if (generatedPayload) {
      onOpen();
    } else {
      toast({
        title: "No payload generated",
        description: "Please generate a payload first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md">
      <Flex justifyContent="space-between" direction={{ base: "column", md: "row" }} gap={4} mb={6}>
        <Heading as="h2" size="lg" variant="special">
          Spark PSM
        </Heading>
        <Box width={{ base: "full", md: "auto" }}>
          <ComposerIndicator />
        </Box>
      </Flex>

      <Card p={6}>
        {/* Operation Type Toggle */}
        <Box mb={6}>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Operation
          </Text>
          <HStack spacing={0} bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="lg" p={1}>
            <Button
              flex={1}
              size="md"
              variant={operationType === "deposit" ? "solid" : "ghost"}
              colorScheme={operationType === "deposit" ? "purple" : "gray"}
              onClick={() => setOperationType("deposit")}
              borderRadius="md"
            >
              Deposit USDC → sUSDS
            </Button>
            <Button
              flex={1}
              size="md"
              variant={operationType === "withdraw" ? "solid" : "ghost"}
              colorScheme={operationType === "withdraw" ? "purple" : "gray"}
              onClick={() => setOperationType("withdraw")}
              borderRadius="md"
            >
              Withdraw sUSDS → USDC
            </Button>
          </HStack>
        </Box>

        {/* Info Alert */}
        <Alert status="info" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            {operationType === "deposit" ? (
              <>
                Swap USDC for USDS in the PSM and deposit in the sUSDS.
                <br />
                <Text as="span" fontWeight="medium">
                  Use this if you want to deposit a specific amount of USDC to sUSDS.
                </Text>
              </>
            ) : (
              <>
                Withdraw a specified amount of USDC with a maximum limit of sUSDS (in USD).
                <br />
                <Text as="span" fontWeight="medium">
                  Use this if you want an exact amount of USDC tokens out. E.g. pay someone 10k
                  exactly.
                </Text>
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Exchange Rate Display */}
        <Box mb={4} p={4} borderRadius="md" borderWidth="1px">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
              Current sUSDS Rate
            </Text>
            {isRateLoading ? (
              <Skeleton height="20px" width="120px" />
            ) : exchangeRate ? (
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="purple.600"
                _dark={{ color: "purple.300" }}
              >
                1 sUSDS = {exchangeRate.toFixed(6)} USDC
              </Text>
            ) : (
              <Text fontSize="sm" color="orange.500">
                Unable to fetch rate
              </Text>
            )}
          </HStack>
        </Box>

        {/* Amount Input */}
        <FormControl mb={4} isRequired isInvalid={!!errors.amount}>
          <FormLabel>
            {operationType === "deposit" ? "Amount in" : "Max amount in"} (in USD)
          </FormLabel>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" h="full">
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                $
              </Text>
            </InputLeftElement>
            <Input
              type="number"
              placeholder="0.00"
              value={amountIn}
              onChange={e => setAmountIn(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, amountIn: true }))}
              size="lg"
              pl={10}
            />
          </InputGroup>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {operationType === "deposit" ? (
              "The amount of USDC to deposit."
            ) : (
              <>
                Please note that maxAmountIn is measured in USD due to increasing value of the sUSDS
              </>
            )}
          </Text>
          {errors.amount && <FormErrorMessage>{errors.amount}</FormErrorMessage>}
        </FormControl>

        {/* Min/Max Amount Input */}
        <FormControl mb={4}>
          <FormLabel>
            {operationType === "deposit" ? "Minimum amount out" : "Amount out"} (in USD)
          </FormLabel>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" h="full">
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                $
              </Text>
            </InputLeftElement>
            <Input
              type="number"
              placeholder={amountIn || "0.00"}
              value={amountOut}
              onChange={e => setAmountOut(e.target.value)}
              size="lg"
              pl={10}
            />
          </InputGroup>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {operationType === "deposit"
              ? "Amount out is measured in USD due to increasing value of the sUSDS."
              : "The amount of USDC to receive."}
          </Text>
        </FormControl>

        {/* Depositor Input */}
        <FormControl mb={4} isRequired isInvalid={!!errors.depositor}>
          <FormLabel>Depositor Address (Safe)</FormLabel>
          <Input
            placeholder="0x..."
            value={depositor}
            onChange={e => setDepositor(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, depositor: true }))}
            size="lg"
            fontFamily="mono"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            Address that will provide the {operationType === "deposit" ? "USDC" : "sUSDS"}
          </Text>
          {errors.depositor && <FormErrorMessage>{errors.depositor}</FormErrorMessage>}
        </FormControl>

        {/* Receiver Input */}
        <FormControl mb={6} isRequired isInvalid={!!errors.receiver}>
          <FormLabel>Receiver Address</FormLabel>
          <Input
            placeholder="0x..."
            value={receiver}
            onChange={e => setReceiver(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, receiver: true }))}
            size="lg"
            fontFamily="mono"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            Address that will receive the {operationType === "deposit" ? "sUSDS" : "USDC"}
          </Text>
          {errors.receiver && <FormErrorMessage>{errors.receiver}</FormErrorMessage>}
        </FormControl>

        {/* Actions Section */}
        <VStack spacing={3} align="stretch">
          <Divider />
          <Text fontWeight="semibold" color="gray.600" _dark={{ color: "gray.400" }}>
            Actions
          </Text>
          {operationType === "deposit" ? (
            <>
              <HStack
                p={3}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
                justify="space-between"
              >
                <HStack>
                  <Box
                    bg="blue.100"
                    _dark={{ bg: "blue.800" }}
                    p={2}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    1
                  </Box>
                  <Text>Approve USDC</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Approve
                </Text>
              </HStack>
              <HStack
                p={3}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
                justify="space-between"
              >
                <HStack>
                  <Box
                    bg="blue.100"
                    _dark={{ bg: "blue.800" }}
                    p={2}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    2
                  </Box>
                  <Text>Deposit USDC → Receive sUSDS</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  swapAndDeposit
                </Text>
              </HStack>
            </>
          ) : (
            <>
              <HStack
                p={3}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
                justify="space-between"
              >
                <HStack>
                  <Box
                    bg="blue.100"
                    _dark={{ bg: "blue.800" }}
                    p={2}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    1
                  </Box>
                  <Text>Approve sUSDS</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Approve
                </Text>
              </HStack>
              <HStack
                p={3}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
                justify="space-between"
              >
                <HStack>
                  <Box
                    bg="blue.100"
                    _dark={{ bg: "blue.800" }}
                    p={2}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    2
                  </Box>
                  <Text>Withdraw USDC</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  withdrawAndSwap
                </Text>
              </HStack>
            </>
          )}
        </VStack>
      </Card>

      {/* Generate Button Row */}
      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        <Flex gap={2}>
          <Button variant="primary" onClick={generatePayload}>
            Generate Payload
          </Button>
          <ComposerButton generateData={generateComposerData} isDisabled={!generatedPayload} />
        </Flex>
        {generatedPayload && <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />}
      </Flex>
      <Divider />

      {/* Generated Payload Display */}
      {generatedPayload && (
        <JsonViewerEditor
          jsonData={generatedPayload}
          onJsonChange={newJson => {
            if (typeof newJson === "string") {
              setGeneratedPayload(newJson);
            } else {
              setGeneratedPayload(JSON.stringify(newJson, null, 4));
            }
          }}
        />
      )}

      {/* Action Buttons */}
      <Box display="flex" alignItems="center" mt="20px">
        <Button
          variant="secondary"
          mr="10px"
          leftIcon={<DownloadIcon />}
          onClick={() => handleDownloadClick(generatedPayload)}
        >
          Download Payload
        </Button>
        <Button
          variant="secondary"
          mr="10px"
          leftIcon={<CopyIcon />}
          onClick={() => copyJsonToClipboard(generatedPayload, toast)}
        >
          Copy Payload to Clipboard
        </Button>
        <OpenPRButton onClick={handleOpenPRModal} />
      </Box>

      {/* Human Readable Text */}
      {humanReadableText && (
        <Box mt="20px">
          <Text fontSize="2xl">Human-readable Text</Text>
          <Box p="20px" mb="20px" borderWidth="1px" borderRadius="lg">
            <Text whiteSpace="pre-line">{humanReadableText}</Text>
          </Box>
          <Button
            variant="secondary"
            leftIcon={<CopyIcon />}
            onClick={() => copyTextToClipboard(humanReadableText, toast)}
          >
            Copy Text to Clipboard
          </Button>
        </Box>
      )}

      {/* Spacer at the bottom */}
      <Box mt={8} />
      <PRCreationModal
        type={"spark-psm"}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
        {...getPrefillValues()}
      />
    </Container>
  );
}
