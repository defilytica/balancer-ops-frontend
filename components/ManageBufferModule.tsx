"use client";
import {
  copyJsonToClipboard,
  generateAddLiquidityToBufferPayload,
  generateRemoveLiquidityPayload,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { TokenSelector } from "@/components/poolCreator/TokenSelector";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { getAddress, getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { GetTokensDocument } from "@/lib/services/apollo/generated/graphql";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";
import { fetchBufferOwnerShares } from "@/lib/services/fetchBufferOwnerShares";
import { fetchBufferTotalShares } from "@/lib/services/fetchBufferTotalShares";
import { formatValue } from "@/lib/utils/formatValue";
import {
  AddressBook,
  GetTokensQuery,
  GetTokensQueryVariables,
  TokenListToken,
} from "@/types/interfaces";
import { useQuery } from "@apollo/client";
import { ChevronRightIcon, CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  List,
  ListIcon,
  ListItem,
  Select,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import { isAddress } from "viem";
import SimulateTransactionButton from "./btns/SimulateTransactionButton";
import { NetworkSelector } from "@/components/NetworkSelector";

interface ManageBufferModuleProps {
  addressBook: AddressBook;
}

enum BufferOperation {
  ADD = "add",
  REMOVE = "remove",
}

export default function ManageBufferModule({ addressBook }: ManageBufferModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenListToken | undefined>();
  const [operationType, setOperationType] = useState<BufferOperation>(BufferOperation.ADD);
  const [underlyingTokenAmount, setUnderlyingTokenAmount] = useState("");
  const [wrappedTokenAmount, setWrappedTokenAmount] = useState("");
  const [sharesAmount, setSharesAmount] = useState("");
  const [ownerSafe, setOwnerSafe] = useState("");
  const [includePermit2, setIncludePermit2] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const toast = useToast();

  const { data: tokensData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
    GetTokensDocument,
    {
      variables: {
        chainIn: [selectedNetwork],
        tokensIn: selectedToken?.underlyingTokenAddress
          ? [selectedToken.underlyingTokenAddress]
          : [],
      },
      skip: !selectedNetwork || !selectedToken?.underlyingTokenAddress,
      context: {
        uri:
          selectedNetwork === "SEPOLIA"
            ? "https://test-api-v3.balancer.fi/"
            : "https://api-v3.balancer.fi/",
      },
    },
  );

  const underlyingToken = useMemo(
    () =>
      tokensData?.tokenGetTokens?.find(
        t => t.address.toLowerCase() === selectedToken?.underlyingTokenAddress?.toLowerCase(),
      ),
    [tokensData?.tokenGetTokens, selectedToken?.underlyingTokenAddress],
  );

  const networkOptionsWithV3 = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    return NETWORK_OPTIONS.filter(network => networksWithV3.includes(network.apiID.toLowerCase()));
  }, [addressBook]);

  // Fetch buffer balance
  const {
    data: bufferBalance,
    isLoading: isLoadingBalance,
    isError: isBalanceError,
  } = useTanStackQuery({
    queryKey: ["bufferBalance", selectedToken?.address, selectedNetwork],
    queryFn: () => fetchBufferBalance(selectedToken!.address, selectedNetwork.toLowerCase()),
    enabled: !!selectedToken && !!selectedNetwork && !!networks[selectedNetwork.toLowerCase()],
  });

  // Fetch buffer total shares
  const {
    data: bufferShares,
    isLoading: isLoadingShares,
    isError: isSharesError,
  } = useTanStackQuery({
    queryKey: ["bufferShares", selectedToken?.address, selectedNetwork],
    queryFn: () => fetchBufferTotalShares(selectedToken!.address, selectedNetwork.toLowerCase()),
    enabled: !!selectedToken && !!selectedNetwork && !!networks[selectedNetwork.toLowerCase()],
  });

  // Fetch buffer owner shares
  const {
    data: ownerShares,
    isLoading: isLoadingOwnerShares,
    isError: isOwnerSharesError,
  } = useTanStackQuery({
    queryKey: ["ownerShares", selectedToken?.address, ownerSafe, selectedNetwork],
    queryFn: () =>
      fetchBufferOwnerShares(selectedToken!.address, ownerSafe, selectedNetwork.toLowerCase()),
    enabled:
      !!selectedToken &&
      !!selectedNetwork &&
      !!networks[selectedNetwork.toLowerCase()] &&
      isAddress(ownerSafe),
  });

  const isGenerateButtonDisabled = useMemo(() => {
    return (
      !selectedNetwork ||
      !selectedToken ||
      !sharesAmount ||
      (!underlyingTokenAmount && !wrappedTokenAmount)
    );
  }, [selectedNetwork, selectedToken, sharesAmount, underlyingTokenAmount, wrappedTokenAmount]);

  const calculateTokenAmounts = (newSharesAmount: string) => {
    if (bufferShares?.shares && bufferBalance && newSharesAmount) {
      try {
        // For ADD: add 0.5% (multiply by 1.005)
        // For REMOVE: subtract 0.5% (multiply by 0.995)
        const slippageMultiplier =
          operationType === BufferOperation.ADD ? BigInt(1005) : BigInt(995);
        const slippageDenominator = BigInt(1000);

        const calculatedUnderlyingAmount =
          (BigInt(newSharesAmount) * bufferBalance.underlyingBalance * slippageMultiplier) /
          (bufferShares.shares * slippageDenominator);

        const calculatedWrappedAmount =
          (BigInt(newSharesAmount) * bufferBalance.wrappedBalance * slippageMultiplier) /
          (bufferShares.shares * slippageDenominator);

        return {
          underlyingAmount: calculatedUnderlyingAmount.toString(),
          wrappedAmount: calculatedWrappedAmount.toString(),
        };
      } catch (error) {
        console.error("Error calculating amounts:", error);
      }
    }
    return null;
  };

  const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSharesAmount(e.target.value);
    const amounts = calculateTokenAmounts(e.target.value);
    if (amounts) {
      setUnderlyingTokenAmount(amounts.underlyingAmount);
      setWrappedTokenAmount(amounts.wrappedAmount);
    }
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedToken(undefined);
    setUnderlyingTokenAmount("");
    setWrappedTokenAmount("");
    setSharesAmount("");
    setOwnerSafe("");
    setIncludePermit2(false);
    setGeneratedPayload(null);
  };

  const handleTokenSelect = (token: TokenListToken) => {
    setSelectedToken(token);
    setUnderlyingTokenAmount("");
    setWrappedTokenAmount("");
    setSharesAmount("");
  };

  const handleRemoveLiquidity = useCallback(
    (chainId: string) => {
      const vaultAddress = getAddress(
        addressBook,
        selectedNetwork.toLowerCase(),
        "20241204-v3-vault",
        "Vault",
      );

      if (!vaultAddress) {
        toast({
          title: "Vault not found",
          description: "Vault is not deployed on the selected network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return null;
      }

      return generateRemoveLiquidityPayload(
        {
          wrappedToken: selectedToken!.address,
          sharesToRemove: sharesAmount,
          minAmountUnderlyingOutRaw: underlyingTokenAmount || "0",
          minAmountWrappedOutRaw: wrappedTokenAmount || "0",
          ownerSafe,
        },
        chainId,
        vaultAddress,
      );
    },
    [
      addressBook,
      selectedNetwork,
      selectedToken,
      sharesAmount,
      underlyingTokenAmount,
      wrappedTokenAmount,
      ownerSafe,
      toast,
    ],
  );

  const handleAddLiquidity = useCallback(
    (chainId: string) => {
      const bufferRouterAddress = getAddress(
        addressBook,
        selectedNetwork.toLowerCase(),
        "20241205-v3-buffer-router",
        "BufferRouter",
      );

      if (!bufferRouterAddress) {
        toast({
          title: "BufferRouter not found",
          description: "BufferRouter is not deployed on the selected network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return null;
      }

      let permit2Address;
      if (includePermit2) {
        permit2Address = getAddress(
          addressBook,
          selectedNetwork.toLowerCase(),
          "uniswap",
          "permit2",
        );
        if (!permit2Address) {
          toast({
            title: "Permit2 not found",
            description: "Permit2 contract is not deployed on the selected network",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return null;
        }
      }

      return generateAddLiquidityToBufferPayload(
        {
          wrappedToken: selectedToken!.address,
          underlyingToken: selectedToken!.underlyingTokenAddress,
          maxAmountUnderlyingIn: underlyingTokenAmount || "0",
          maxAmountWrappedIn: wrappedTokenAmount || "0",
          exactSharesToIssue: sharesAmount,
          ownerSafe,
          includePermit2,
        },
        chainId,
        bufferRouterAddress,
        permit2Address,
      );
    },
    [
      addressBook,
      selectedNetwork,
      selectedToken,
      underlyingTokenAmount,
      wrappedTokenAmount,
      sharesAmount,
      ownerSafe,
      includePermit2,
      toast,
    ],
  );

  const handleGenerateClick = useCallback(() => {
    if (!selectedNetwork || !selectedToken || !sharesAmount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const networkInfo = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    if (!networkInfo) {
      toast({
        title: "Invalid network",
        description: "Selected network is not valid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!underlyingTokenAmount && !wrappedTokenAmount) {
      toast({
        title: "Missing amount",
        description:
          "At least one of Underlying Token Amount or Wrapped Token Amount must be non-zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (underlyingTokenAmount && parseFloat(underlyingTokenAmount) < 0) {
      toast({
        title: "Invalid amount",
        description: "Underlying Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (wrappedTokenAmount && parseFloat(wrappedTokenAmount) < 0) {
      toast({
        title: "Invalid amount",
        description: "Wrapped Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const payload =
      operationType === BufferOperation.REMOVE
        ? handleRemoveLiquidity(networkInfo.chainId)
        : handleAddLiquidity(networkInfo.chainId);

    if (payload) {
      setGeneratedPayload(JSON.stringify(payload, null, 2));
    }
  }, [
    selectedNetwork,
    selectedToken,
    sharesAmount,
    underlyingTokenAmount,
    wrappedTokenAmount,
    operationType,
    handleRemoveLiquidity,
    handleAddLiquidity,
    toast,
  ]);

  return (
    <Container maxW="container.lg" mx="auto" p={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="lg" variant="special">
          Manage Liquidity Buffer
        </Heading>
        <Alert status="info" mb={4} py={3} variant="left-accent" borderRadius="md">
          <Box flex="1">
            <Flex align="center">
              <AlertIcon />
              <AlertTitle fontSize="lg">Add and remove liquidity</AlertTitle>
            </Flex>
            <AlertDescription display="block">
              <List spacing={2} fontSize="sm" mt={2}>
                <ListItem>
                  <ListIcon as={ChevronRightIcon} />
                  For a detailed guide on how to manage liquidity in a buffer, please see{" "}
                  <Link
                    href="https://docs.balancer.fi/concepts/vault/buffer.html#erc4626-liquidity-buffers"
                    textDecoration="underline"
                    isExternal
                  >
                    this documentation
                  </Link>
                  .
                </ListItem>
                <ListItem>
                  <ListIcon as={ChevronRightIcon} />
                  Remove Liquidity operation calls the method exposed by the Vault proxy, requiring
                  an encoded function call to the Vault contract, more info{" "}
                  <Link
                    href="https://docs.balancer.fi/developer-reference/contracts/vault-api.html"
                    textDecoration="underline"
                    isExternal
                  >
                    here
                  </Link>
                  .
                </ListItem>
                <ListItem>
                  <ListIcon as={ChevronRightIcon} />
                  When you enter the amount of shares, the token amounts are automatically
                  calculated with a 0.5% slippage applied.
                </ListItem>
              </List>
            </AlertDescription>
          </Box>
        </Alert>
        <FormControl>
          <FormLabel>Operation Type</FormLabel>
          <Select
            value={operationType}
            onChange={e => {
              setOperationType(e.target.value as BufferOperation);
            }}
          >
            <option value={BufferOperation.ADD}>Add Liquidity</option>
            <option value={BufferOperation.REMOVE}>Remove Liquidity</option>
          </Select>
        </FormControl>
        <Flex direction={{ base: "column", md: "row" }} gap={4} mb={4}>
          <Box flex="1">
            <NetworkSelector
              networks={networks}
              networkOptions={networkOptionsWithV3}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </Box>

          <Box flex="1">
            <FormControl isRequired>
              <FormLabel>Wrapped Token</FormLabel>
              <TokenSelector
                selectedNetwork={selectedNetwork}
                onSelect={handleTokenSelect}
                selectedToken={selectedToken}
                placeholder="Select wrapped token"
                isDisabled={!selectedNetwork}
                onlyErc4626={true}
              />
              {underlyingToken && (
                <Text fontSize="sm" mt={1.5} color="gray.400">
                  Underlying token: {underlyingToken.address} ({underlyingToken.symbol})
                </Text>
              )}
            </FormControl>
          </Box>
        </Flex>

        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <FormControl>
            <FormLabel>
              {operationType === BufferOperation.ADD
                ? "Max Underlying Token Amount"
                : "Min Underlying Token Out"}
            </FormLabel>
            <Input
              name="underlyingTokenAmount"
              value={underlyingTokenAmount}
              onChange={e => setUnderlyingTokenAmount(e.target.value)}
              placeholder="Amount in token native decimals"
              type="number"
              isDisabled={!selectedToken}
            />
            {selectedToken && (
              <>
                {isLoadingBalance ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Loading balance...
                  </Text>
                ) : isBalanceError ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Failed to load balance
                  </Text>
                ) : (
                  bufferBalance && (
                    <Flex direction="column" gap={1} mt={1.5}>
                      <Text fontSize="sm" color="gray.400">
                        Balance: {bufferBalance.underlyingBalance.toString()}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ≈{" "}
                        {formatValue(
                          bufferBalance.underlyingBalance,
                          underlyingToken?.decimals ?? 0,
                        )}{" "}
                        {underlyingToken?.symbol}
                      </Text>
                    </Flex>
                  )
                )}
              </>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>
              {operationType === BufferOperation.ADD
                ? "Max Wrapped Token Amount"
                : "Min Wrapped Token Out"}
            </FormLabel>
            <Input
              name="wrappedTokenAmount"
              value={wrappedTokenAmount}
              onChange={e => setWrappedTokenAmount(e.target.value)}
              placeholder="Amount in token native decimals"
              type="number"
              isDisabled={!selectedToken}
            />
            {selectedToken && (
              <>
                {isLoadingBalance ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Loading balance...
                  </Text>
                ) : isBalanceError ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Failed to load balance
                  </Text>
                ) : (
                  bufferBalance && (
                    <Flex direction="column" gap={1} mt={1}>
                      <Text fontSize="sm" color="gray.400">
                        Balance: {bufferBalance.wrappedBalance.toString()}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ≈ {formatValue(bufferBalance.wrappedBalance, selectedToken.decimals)}{" "}
                        {selectedToken.symbol}
                      </Text>
                    </Flex>
                  )
                )}
              </>
            )}
          </FormControl>

          <FormControl isRequired>
            <FormLabel>
              {operationType === BufferOperation.ADD
                ? "Shares To Issue Amount"
                : "Shares To Remove Amount"}
            </FormLabel>
            <Input
              name="sharesAmount"
              value={sharesAmount}
              onChange={handleSharesChange}
              placeholder={
                operationType === BufferOperation.ADD
                  ? "Amount of shares to issue"
                  : "Amount of shares to remove"
              }
              type="number"
              isDisabled={!selectedToken}
            />
            {selectedToken && (
              <>
                {isLoadingShares ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Loading shares...
                  </Text>
                ) : isSharesError ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Failed to load shares
                  </Text>
                ) : (
                  bufferShares && (
                    <Flex direction="column" gap={1} mt={1}>
                      <Text fontSize="sm" color="gray.400">
                        Balance: {bufferShares.shares.toString()}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ≈ {formatValue(bufferShares.shares, underlyingToken?.decimals ?? 0)}
                      </Text>
                    </Flex>
                  )
                )}
              </>
            )}
          </FormControl>
        </Flex>

        <Flex direction="column" width={{ base: "100%", md: "50%" }} minW={{ md: "300px" }}>
          <FormControl>
            <FormLabel>Shares Owner Safe Address</FormLabel>
            <InputGroup>
              <Input
                name="ownerSafe"
                value={ownerSafe}
                onChange={e => setOwnerSafe(e.target.value)}
                placeholder="Shares Owner Safe address"
                isDisabled={!selectedToken}
              />
              {ownerSafe.length >= 42 && (
                <InputRightElement>
                  <Text fontSize="sm" color={isAddress(ownerSafe) ? "green.500" : "red.500"}>
                    {isAddress(ownerSafe) ? "✓" : "✗"}
                  </Text>
                </InputRightElement>
              )}
            </InputGroup>
            {isAddress(ownerSafe) && selectedToken && (
              <>
                {isLoadingOwnerShares ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Loading owner shares...
                  </Text>
                ) : isOwnerSharesError ? (
                  <Text fontSize="sm" mt={1} color="gray.400">
                    Failed to load owner shares
                  </Text>
                ) : (
                  ownerShares && (
                    <>
                      <Flex direction="column" gap={1} mt={1}>
                        <Text fontSize="sm" color="gray.400">
                          Address balance: {ownerShares.ownerShares.toString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          ≈ {formatValue(ownerShares.ownerShares, underlyingToken?.decimals ?? 0)}
                        </Text>
                      </Flex>
                    </>
                  )
                )}
              </>
            )}
          </FormControl>
          <Box mt={6}>
            <Checkbox
              size="lg"
              onChange={e => setIncludePermit2(e.target.checked)}
              isDisabled={!selectedToken || operationType === BufferOperation.REMOVE}
              isChecked={operationType === BufferOperation.REMOVE ? false : includePermit2}
            >
              <FormLabel mb="0">Include Permit2 approvals</FormLabel>
            </Checkbox>
          </Box>
        </Flex>
        {operationType === BufferOperation.REMOVE &&
          ownerShares?.ownerShares === BigInt(0) &&
          isAddress(ownerSafe) && (
            <Alert status="error" alignItems="center">
              <AlertIcon />
              <Text>
                <b>No shares found.</b> This address has no shares in this buffer.
              </Text>
            </Alert>
          )}

        {selectedToken && bufferShares?.shares === BigInt(0) && (
          <Alert status="error" alignItems="center">
            <AlertIcon />
            <Text>
              <b>This buffer is empty.</b> Make sure the buffer exists - you may need to initialize
              it first.
            </Text>
          </Alert>
        )}

        <Flex justifyContent="space-between" alignItems="center" mt="5" mb="2">
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            isDisabled={isGenerateButtonDisabled}
          >
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
        </Flex>
        <Divider />

        {generatedPayload && (
          <>
            <JsonViewerEditor
              jsonData={generatedPayload}
              onJsonChange={newJson => setGeneratedPayload(newJson)}
            />

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
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
}
