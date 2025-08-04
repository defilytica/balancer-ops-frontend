"use client";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
  Flex,
  Divider,
  Checkbox,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  Container,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  AddressBook,
  GetTokensQuery,
  GetTokensQueryVariables,
  TokenListToken,
} from "@/types/interfaces";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import {
  copyJsonToClipboard,
  generateInitializeBufferPayload,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS, networks, V3_VAULT_ADDRESS } from "@/constants/constants";
import SimulateTransactionButton from "./btns/SimulateTransactionButton";
import { getAddress, getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { TokenSelector } from "@/components/poolCreator/TokenSelector";
import { GetTokensDocument } from "@/lib/services/apollo/generated/graphql";
import { useQuery } from "@apollo/client";
import { NetworkSelector } from "@/components/NetworkSelector";
import { fetchBufferInitializationStatus } from "@/lib/services/fetchBufferInitializationStatus";
import { fetchBufferAsset } from "@/lib/services/fetchBufferAsset";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { isZeroAddress } from "@ethereumjs/util";
import { isAddress } from "viem";
import { useDebounce } from "use-debounce";
import ComposerButton from "@/app/payload-builder/composer/ComposerButton";
import ComposerIndicator from "@/app/payload-builder/composer/ComposerIndicator";
import { useAccount, useSwitchChain } from "wagmi";
import { ethers } from "ethers";
import { V3vaultAdmin } from "@/abi/v3vaultAdmin";

interface InitializeBufferModuleProps {
  addressBook: AddressBook;
}

export default function InitializeBufferModule({ addressBook }: InitializeBufferModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenListToken | undefined>();
  const [underlyingTokenAddress, setUnderlyingTokenAddress] = useState("");
  const [exactAmountUnderlyingIn, setExactAmountUnderlyingIn] = useState("");
  const [exactAmountWrappedIn, setExactAmountWrappedIn] = useState("");
  const [minIssuedShares, setMinIssuedShares] = useState("");
  const [seedingSafe, setSeedingSafe] = useState("");
  const [includePermit2, setIncludePermit2] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [isCurrentWalletManager, setIsCurrentWalletManager] = useState(false);
  const toast = useToast();

  // Chain state switch
  const { switchChain } = useSwitchChain();

  // Add wallet connection hook
  const { address: walletAddress } = useAccount();

  const [debouncedUnderlyingTokenAddress] = useDebounce(underlyingTokenAddress, 300);

  // Fetch buffer initialization status - needed early for useEffect
  const { data: isInitialized, isLoading: isLoadingInitialized } = useTanStackQuery({
    queryKey: ["bufferInitialized", selectedToken?.address, selectedNetwork],
    queryFn: () =>
      fetchBufferInitializationStatus(selectedToken!.address, selectedNetwork.toLowerCase()),
    enabled:
      !!selectedToken?.address && !!selectedNetwork && !!networks[selectedNetwork.toLowerCase()],
  });

  // Add effect to check if current wallet can initialize buffer
  useEffect(() => {
    // For buffer initialization, anyone with a connected wallet can initialize
    // The connected wallet becomes the shares owner
    if (walletAddress && selectedToken && !isInitialized) {
      setIsCurrentWalletManager(true);
    } else {
      setIsCurrentWalletManager(false);
    }
  }, [walletAddress, selectedToken, isInitialized]);

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

  // Fetch buffer asset (underlying token) for manually added token
  const { data: bufferAsset } = useTanStackQuery({
    queryKey: ["bufferAsset", selectedToken?.address, selectedNetwork],
    queryFn: () => fetchBufferAsset(selectedToken!.address, selectedNetwork.toLowerCase()),
    enabled:
      !!selectedToken &&
      !!selectedNetwork &&
      !!networks[selectedNetwork.toLowerCase()] &&
      selectedToken.isManual,
  });

  const networkOptionsWithV3 = useMemo(() => {
    const networksWithVaultExplorer = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    return NETWORK_OPTIONS.filter(network =>
      networksWithVaultExplorer.includes(network.apiID.toLowerCase()),
    );
  }, [addressBook]);

  const isGenerateButtonDisabled = useMemo(() => {
    // Check if required fields are missing
    if (!selectedNetwork || !selectedToken || !minIssuedShares) {
      return true;
    }

    // Check if both amounts are empty
    if (!exactAmountUnderlyingIn.trim() && !exactAmountWrappedIn.trim()) {
      return true;
    }

    // Check if underlying amount is provided but underlying token address is invalid
    if (
      exactAmountUnderlyingIn.trim() &&
      parseFloat(exactAmountUnderlyingIn) > 0 &&
      (!debouncedUnderlyingTokenAddress ||
        isZeroAddress(debouncedUnderlyingTokenAddress) ||
        !isAddress(debouncedUnderlyingTokenAddress))
    ) {
      return true;
    }

    return false;
  }, [
    selectedNetwork,
    selectedToken,
    minIssuedShares,
    exactAmountUnderlyingIn,
    exactAmountWrappedIn,
    debouncedUnderlyingTokenAddress,
  ]);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedToken(undefined);
    setUnderlyingTokenAddress("");
    setExactAmountUnderlyingIn("");
    setExactAmountWrappedIn("");
    setMinIssuedShares("");
    setSeedingSafe("");
    setIncludePermit2(false);
    setGeneratedPayload(null);
    setIsCurrentWalletManager(false);

    // Find the corresponding chain ID for the selected network and switch
    const networkOption = networkOptionsWithV3.find(n => n.apiID === newNetwork);
    if (networkOption && newNetwork) {
      try {
        switchChain({ chainId: Number(networkOption.chainId) });
      } catch {
        toast({
          title: "Error switching network",
          description: "Please switch network manually in your wallet",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleTokenSelect = (token: TokenListToken) => {
    setSelectedToken(token);
    // Auto-fill underlying token if available from token data
    if (token.underlyingTokenAddress) {
      setUnderlyingTokenAddress(token.underlyingTokenAddress);
    } else {
      // For manual tokens, clear the underlying address so user can input it
      setUnderlyingTokenAddress("");
    }
  };

  // Auto-fill underlying token address when bufferAsset is fetched for manual tokens
  useEffect(() => {
    if (
      selectedToken?.isManual &&
      bufferAsset?.underlyingToken &&
      !isZeroAddress(bufferAsset.underlyingToken)
    ) {
      setUnderlyingTokenAddress(bufferAsset.underlyingToken);
    }
  }, [bufferAsset, selectedToken]);

  // Direct transaction execution for EOA
  const handleDirectBufferInitialization = useCallback(async () => {
    try {
      if (!selectedToken || !minIssuedShares) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!exactAmountUnderlyingIn && !exactAmountWrappedIn) {
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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(V3_VAULT_ADDRESS, V3vaultAdmin, signer);

      const tx = await contract.initializeBuffer(
        selectedToken.address,
        exactAmountUnderlyingIn || "0",
        exactAmountWrappedIn || "0",
        minIssuedShares,
        walletAddress, // shares owner is the connected wallet
      );

      toast.promise(tx.wait(), {
        success: {
          title: "Success",
          description: `Buffer initialized successfully. Changes will appear in the UI in the next few minutes after the block is indexed.`,
          duration: 5000,
          isClosable: true,
        },
        loading: {
          title: "Initializing buffer",
          description: "Waiting for transaction confirmation... Please wait.",
        },
        error: (error: any) => ({
          title: "Error",
          description: error.message,
          duration: 7000,
          isClosable: true,
        }),
      });
    } catch (error: any) {
      toast({
        title: "Error executing transaction",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [
    selectedToken,
    minIssuedShares,
    exactAmountUnderlyingIn,
    exactAmountWrappedIn,
    walletAddress,
    toast,
  ]);

  const handleGeneratePayload = useCallback(async () => {
    // Validation
    if (!selectedNetwork || !selectedToken || !minIssuedShares) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (isInitialized) {
      toast({
        title: "Buffer already initialized",
        description: "This buffer is already initialized. You cannot initialize it again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!exactAmountUnderlyingIn && !exactAmountWrappedIn) {
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

    if (exactAmountUnderlyingIn && parseFloat(exactAmountUnderlyingIn) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Underlying Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Wrapped Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate underlying token address when underlying amount is provided
    if (exactAmountUnderlyingIn && parseFloat(exactAmountUnderlyingIn) > 0) {
      if (
        !debouncedUnderlyingTokenAddress ||
        isZeroAddress(debouncedUnderlyingTokenAddress) ||
        !isAddress(debouncedUnderlyingTokenAddress)
      ) {
        toast({
          title: "Invalid underlying token address",
          description:
            "When providing an underlying token amount, you must provide a valid underlying token address.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
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
      return;
    }

    let permit2Address;
    if (includePermit2) {
      permit2Address = getAddress(addressBook, selectedNetwork.toLowerCase(), "uniswap", "permit2");
      if (!permit2Address) {
        toast({
          title: "Permit2 not found",
          description: "Permit2 contract is not deployed on the selected network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    // Always generate payload
    const payload = generateInitializeBufferPayload(
      {
        wrappedToken: selectedToken.address,
        underlyingToken: debouncedUnderlyingTokenAddress,
        exactAmountUnderlyingIn: exactAmountUnderlyingIn || "0",
        exactAmountWrappedIn: exactAmountWrappedIn || "0",
        minIssuedShares,
        seedingSafe,
        includePermit2,
      },
      networkInfo.chainId,
      bufferRouterAddress,
      permit2Address,
    );

    setGeneratedPayload(JSON.stringify(payload, null, 2));
  }, [
    selectedNetwork,
    selectedToken,
    debouncedUnderlyingTokenAddress,
    minIssuedShares,
    exactAmountUnderlyingIn,
    exactAmountWrappedIn,
    includePermit2,
    seedingSafe,
    toast,
    addressBook,
    isInitialized,
  ]);

  const handleDirectExecution = useCallback(async () => {
    // Validation
    if (!selectedNetwork || !selectedToken || !minIssuedShares) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (isInitialized) {
      toast({
        title: "Buffer already initialized",
        description: "This buffer is already initialized. You cannot initialize it again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!exactAmountUnderlyingIn && !exactAmountWrappedIn) {
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

    if (exactAmountUnderlyingIn && parseFloat(exactAmountUnderlyingIn) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Underlying Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Wrapped Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate underlying token address when underlying amount is provided
    if (exactAmountUnderlyingIn && parseFloat(exactAmountUnderlyingIn) > 0) {
      if (
        !debouncedUnderlyingTokenAddress ||
        isZeroAddress(debouncedUnderlyingTokenAddress) ||
        !isAddress(debouncedUnderlyingTokenAddress)
      ) {
        toast({
          title: "Invalid underlying token address",
          description:
            "When providing an underlying token amount, you must provide a valid underlying token address.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    // Execute directly via wallet
    await handleDirectBufferInitialization();
  }, [
    selectedNetwork,
    selectedToken,
    minIssuedShares,
    exactAmountUnderlyingIn,
    exactAmountWrappedIn,
    debouncedUnderlyingTokenAddress,
    isInitialized,
    handleDirectBufferInitialization,
    toast,
  ]);

  // Generate composer data only when button is clicked
  const generateComposerData = useCallback(() => {
    if (!generatedPayload) return null;

    const payload =
      typeof generatedPayload === "string" ? JSON.parse(generatedPayload) : generatedPayload;

    let wrappedToken =
      payload.transactions[payload.transactions.length - 1].contractInputsValues.wrappedToken;
    let minIssuedShares =
      payload.transactions[payload.transactions.length - 1].contractInputsValues.minIssuedShares;

    return {
      type: "initialize-buffer",
      title: "Initialize Liquidity Buffer",
      description: payload.meta.description,
      payload: payload,
      params: {
        wrappedToken: wrappedToken,
        minIssuedShares: minIssuedShares,
      },
      builderPath: "initialize-buffer",
    };
  }, [generatedPayload]);

  return (
    <Container maxW="container.lg" mx="auto" p={4}>
      <VStack spacing={4} align="stretch">
        <Flex justifyContent="space-between" direction={{ base: "column", md: "row" }} gap={4}>
          <Heading as="h2" size="lg" variant="special">
            Initialize Liquidity Buffer
          </Heading>
          <Box width={{ base: "full", md: "auto" }}>
            <ComposerIndicator />
          </Box>
        </Flex>
        <Alert status="info" mt={4} mb={4}>
          <Flex align="center">
            <AlertIcon />
            <Text>
              For a detailed guide on how to initialize buffers, please see{" "}
              <Link
                href="https://github.com/BalancerMaxis/multisig-ops/blob/main/docs/Buffer-Documentation/Initializing-Buffers.md"
                textDecoration="underline"
                isExternal
              >
                this documentation
              </Link>
              .
            </Text>
          </Flex>
        </Alert>

        <Box width="calc(50% - 8px)">
          <NetworkSelector
            networks={networks}
            networkOptions={networkOptionsWithV3}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </Box>
        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <FormControl isRequired>
            <FormLabel>Wrapped Token</FormLabel>
            <TokenSelector
              selectedNetwork={selectedNetwork}
              onSelect={handleTokenSelect}
              selectedToken={selectedToken}
              placeholder="Select wrapped token"
              isDisabled={!selectedNetwork}
              onlyErc4626={true}
              allowManualInput={true}
            />
          </FormControl>
          <FormControl>
            <FormLabel>
              Underlying Token Address
              {!selectedToken?.isManual && underlyingToken && ` (${underlyingToken.symbol})`}
            </FormLabel>
            <InputGroup>
              <Input
                placeholder="0x..."
                value={underlyingTokenAddress}
                onChange={e => setUnderlyingTokenAddress(e.target.value)}
                isDisabled={
                  !selectedToken ||
                  (!!selectedToken.underlyingTokenAddress &&
                    !isZeroAddress(selectedToken.underlyingTokenAddress)) ||
                  (selectedToken.isManual &&
                    bufferAsset?.underlyingToken &&
                    !isZeroAddress(bufferAsset.underlyingToken))
                }
              />
              {debouncedUnderlyingTokenAddress.trim() && (
                <InputRightElement>
                  <Text
                    fontSize="sm"
                    color={isAddress(debouncedUnderlyingTokenAddress) ? "green.500" : "red.500"}
                  >
                    {isAddress(debouncedUnderlyingTokenAddress) ? "✓" : "✗"}
                  </Text>
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>
        </Flex>
        <Flex direction={{ base: "column", md: "row" }} gap={4} mb={2}>
          <FormControl>
            <FormLabel>Wrapped Token Amount</FormLabel>
            <Input
              name="exactAmountWrappedIn"
              value={exactAmountWrappedIn}
              onChange={e => setExactAmountWrappedIn(e.target.value)}
              placeholder="Amount in token native decimals"
              type="number"
              isDisabled={!selectedToken}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Underlying Token Amount</FormLabel>
            <Input
              name="exactAmountUnderlyingIn"
              value={exactAmountUnderlyingIn}
              onChange={e => setExactAmountUnderlyingIn(e.target.value)}
              placeholder="Amount in token native decimals"
              type="number"
              isDisabled={!selectedToken}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Minimum Issued Shares</FormLabel>
            <Input
              name="minIssuedShares"
              value={minIssuedShares}
              onChange={e => setMinIssuedShares(e.target.value)}
              placeholder="Minimum issued shares amount"
              type="number"
              isDisabled={!selectedToken}
            />
          </FormControl>
        </Flex>

        <Flex direction="column" width={{ base: "100%", md: "50%" }} minW={{ md: "300px" }}>
          <FormControl>
            <FormLabel>Seeding Safe</FormLabel>
            <Input
              name="seedingSafe"
              value={seedingSafe}
              onChange={e => setSeedingSafe(e.target.value)}
              placeholder="Seeding Safe address"
              isDisabled={!selectedToken}
            />
          </FormControl>
          <Box mt={6}>
            <Checkbox
              size="lg"
              onChange={e => setIncludePermit2(e.target.checked)}
              isDisabled={!selectedToken}
            >
              <FormLabel mb="0">Include Permit2 approvals</FormLabel>
            </Checkbox>
          </Box>
        </Flex>

        {/* EOA/Wallet status alerts */}
        {selectedToken && isCurrentWalletManager && !isInitialized && (
          <Alert status="info" mt={4}>
            <AlertIcon />
            <Text>You can initialize this buffer directly through your connected wallet.</Text>
          </Alert>
        )}

        {selectedToken && !isCurrentWalletManager && !isInitialized && (
          <Alert status="info" mt={4}>
            <AlertIcon />
            <Text>
              Connect a wallet to initialize this buffer directly, or generate a payload for Safe
              execution.
            </Text>
          </Alert>
        )}

        {/* Display error if buffer is already initialized */}
        {selectedToken && selectedNetwork && isInitialized && (
          <Alert status="error" alignItems="center">
            <AlertIcon />
            <Text>
              <b>This buffer is already initialized.</b> You cannot initialize it again.
            </Text>
          </Alert>
        )}

        <Flex justifyContent="space-between" alignItems="center" mt="5" mb="2" wrap="wrap" gap={2}>
          <Flex gap={2} align="center">
            {!selectedToken ? (
              <Button variant="primary" isDisabled={true}>
                Select a Token
              </Button>
            ) : isInitialized ? (
              <Button variant="primary" isDisabled={true}>
                Already Initialized
              </Button>
            ) : isCurrentWalletManager ? (
              <>
                <Button
                  variant="primary"
                  onClick={handleDirectExecution}
                  isDisabled={isGenerateButtonDisabled}
                >
                  Execute Initialize Buffer
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGeneratePayload}
                  isDisabled={isGenerateButtonDisabled}
                >
                  Generate Payload
                </Button>
                <ComposerButton
                  generateData={generateComposerData}
                  isDisabled={!generatedPayload || isInitialized}
                />
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={handleGeneratePayload}
                  isDisabled={isGenerateButtonDisabled}
                >
                  Generate Payload
                </Button>
                <ComposerButton
                  generateData={generateComposerData}
                  isDisabled={!generatedPayload || isInitialized}
                />
              </>
            )}
          </Flex>
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
