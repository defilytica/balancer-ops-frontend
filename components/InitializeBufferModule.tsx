"use client";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
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
  AlertDescription,
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
import { NETWORK_OPTIONS, networks, SONIC_BUFFER_ROUTER, SONIC_PERMIT2 } from "@/constants/constants";
import SimulateTransactionButton from "./btns/SimulateTransactionButton";
import SimulateEOATransactionButton from "./btns/SimulateEOATransactionButton";
import { buildInitializeBufferSimulationTransactions } from "@/app/payload-builder/simulationHelperFunctions";
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
import { ERC20 } from "@/abi/erc20";
import BufferRouterABI from "@/abi/BufferRouter.json";
import Permit2ABI from "@/abi/Permit2.json";

interface InitializeBufferModuleProps {
  addressBook: AddressBook;
}

// Define execution modes
enum ExecutionMode {
  SAFE = "safe",
  EOA = "eoa",
}

const getPermit2Address = (addressBook: AddressBook, network: string): string | undefined => {
  if (network.toLowerCase() === "sonic") {
    return SONIC_PERMIT2;
  }
  return getAddress(addressBook, network.toLowerCase(), "uniswap", "permit2");
};

export default function InitializeBufferModule({ addressBook }: InitializeBufferModuleProps) {
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(ExecutionMode.EOA);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenListToken | undefined>();
  const [underlyingTokenAddress, setUnderlyingTokenAddress] = useState("");
  const [exactAmountUnderlyingIn, setExactAmountUnderlyingIn] = useState("");
  const [exactAmountWrappedIn, setExactAmountWrappedIn] = useState("");
  const [minIssuedShares, setMinIssuedShares] = useState("");
  const [seedingSafe, setSeedingSafe] = useState("");
  const [includePermit2, setIncludePermit2] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
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

  // Auto-switch to Safe mode when wallet is not connected, unless manually overridden
  useEffect(() => {
    if (!walletAddress && executionMode === ExecutionMode.EOA) {
      setExecutionMode(ExecutionMode.SAFE);
    }
  }, [walletAddress, executionMode]);

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
    return NETWORK_OPTIONS.filter(
      network =>
        networksWithVaultExplorer.includes(network.apiID.toLowerCase()) ||
        network.apiID === "SONIC",
    );
  }, [addressBook]);

  const isGenerateButtonDisabled = useMemo(() => {
    // Check if required fields are missing
    if (!selectedNetwork || !selectedToken) {
      return true;
    }

    // Check if both amounts are empty or zero
    const underlyingAmount = parseFloat(exactAmountUnderlyingIn) || 0;
    const wrappedAmount = parseFloat(exactAmountWrappedIn) || 0;
    if (underlyingAmount <= 0 && wrappedAmount <= 0) {
      return true;
    }

    // Check if underlying amount is provided but underlying token address is invalid
    return (
      underlyingAmount > 0 &&
      (!debouncedUnderlyingTokenAddress ||
        isZeroAddress(debouncedUnderlyingTokenAddress) ||
        !isAddress(debouncedUnderlyingTokenAddress))
    );
  }, [
    selectedNetwork,
    selectedToken,
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
    // Reset execution mode on network change if needed

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

  // Get buffer router address with validation
  const getBufferRouterAddress = useCallback(() => {
    if (!selectedNetwork) return null;

    let bufferRouterAddress;
    if (selectedNetwork.toLowerCase() === "sonic") {
      bufferRouterAddress = SONIC_BUFFER_ROUTER;
    } else {
      bufferRouterAddress = getAddress(
        addressBook,
        selectedNetwork.toLowerCase(),
        "20241205-v3-buffer-router",
        "BufferRouter",
      );
    }

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

    return bufferRouterAddress;
  }, [selectedNetwork, addressBook, toast]);

  // Function to wrap underlying tokens to wrapped tokens
  const handleWrapTokens = useCallback(async () => {
    try {
      if (!selectedToken || !exactAmountUnderlyingIn) {
        toast({
          title: "Missing information",
          description: "Please select a token and enter an underlying token amount to wrap",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!debouncedUnderlyingTokenAddress) {
        toast({
          title: "Missing underlying token address",
          description: "Cannot determine underlying token address",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Step 1: Approve wrapped token to spend underlying tokens
      const underlyingTokenContract = new ethers.Contract(
        debouncedUnderlyingTokenAddress,
        ERC20,
        signer,
      );

      const currentAllowance = await underlyingTokenContract.allowance(
        walletAddress,
        selectedToken.address, // wrapped token address
      );

      if (currentAllowance < BigInt(exactAmountUnderlyingIn)) {
        const approveTx = await underlyingTokenContract.approve(
          selectedToken.address, // wrapped token address
          exactAmountUnderlyingIn,
        );
        await approveTx.wait();
        console.log(
          `Approved wrapped token to spend underlying tokens: ${exactAmountUnderlyingIn}`,
        );
      }

      // Step 2: Deposit/wrap the tokens
      const wrappedTokenContract = new ethers.Contract(
        selectedToken.address,
        ["function deposit(uint256 assets, address receiver) external returns (uint256 shares)"],
        signer,
      );

      const wrapTx = await wrappedTokenContract.deposit(
        exactAmountUnderlyingIn,
        walletAddress, // recipient
      );

      toast.promise(wrapTx.wait(), {
        success: {
          title: "Success",
          description: `Tokens wrapped successfully! You now have wrapped tokens for buffer initialization.`,
          duration: 5000,
          isClosable: true,
        },
        loading: {
          title: "Wrapping tokens",
          description: "Converting underlying tokens to wrapped tokens... Please wait.",
        },
        error: (error: any) => ({
          title: "Error wrapping tokens",
          description: error.message,
          duration: 7000,
          isClosable: true,
        }),
      });
    } catch (error: any) {
      toast({
        title: "Error wrapping tokens",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [
    selectedToken,
    exactAmountUnderlyingIn,
    debouncedUnderlyingTokenAddress,
    walletAddress,
    toast,
  ]);

  // Direct transaction execution for EOA
  const handleDirectBufferInitialization = useCallback(async () => {
    try {
      if (!selectedToken) {
        toast({
          title: "Missing information",
          description: "Please select a wrapped token",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const underlyingAmount = parseFloat(exactAmountUnderlyingIn) || 0;
      const wrappedAmount = parseFloat(exactAmountWrappedIn) || 0;
      if (underlyingAmount <= 0 && wrappedAmount <= 0) {
        toast({
          title: "Missing amount",
          description:
            "At least one of Underlying Token Amount or Wrapped Token Amount must be greater than 0",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Check minimum amounts
      if (underlyingAmount > 0 && underlyingAmount < 10000) {
        toast({
          title: "Amount too small",
          description: "Underlying Token Amount must be at least 10000",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (wrappedAmount > 0 && wrappedAmount < 10000) {
        toast({
          title: "Amount too small",
          description: "Wrapped Token Amount must be at least 10000",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const bufferRouterAddress = getBufferRouterAddress();
      if (!bufferRouterAddress) return;

      // Get permit2 address
      const permit2Address = getPermit2Address(addressBook, selectedNetwork);

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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Step 1: Check token balances first - fail fast if insufficient

      if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) > 0) {
        const wrappedTokenContract = new ethers.Contract(selectedToken.address, ERC20, signer);
        const wrappedBalance = await wrappedTokenContract.balanceOf(walletAddress);
        console.log(
          `Wrapped token balance: ${wrappedBalance.toString()}, needed: ${exactAmountWrappedIn}`,
        );

        if (wrappedBalance < BigInt(exactAmountWrappedIn)) {
          toast({
            title: "Insufficient wrapped token balance",
            description: `You have ${wrappedBalance.toString()} but need ${exactAmountWrappedIn}`,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          return;
        }
      }

      if (
        exactAmountUnderlyingIn &&
        parseFloat(exactAmountUnderlyingIn) > 0 &&
        debouncedUnderlyingTokenAddress
      ) {
        const underlyingTokenContract = new ethers.Contract(
          debouncedUnderlyingTokenAddress,
          ERC20,
          signer,
        );
        const balance = await underlyingTokenContract.balanceOf(walletAddress);
        console.log(
          `Underlying token balance: ${balance.toString()}, needed: ${exactAmountUnderlyingIn}`,
        );

        if (balance < BigInt(exactAmountUnderlyingIn)) {
          toast({
            title: "Insufficient underlying token balance",
            description: `You have ${balance.toString()} but need ${exactAmountUnderlyingIn}`,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          return;
        }
      }

      // Step 2: Handle token approvals to Permit2 (actual amounts)

      if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) > 0) {
        const wrappedTokenContract = new ethers.Contract(selectedToken.address, ERC20, signer);

        // Check current ERC20 allowance to Permit2
        const currentWrappedAllowance = await wrappedTokenContract.allowance(
          walletAddress,
          permit2Address,
        );
        console.log(`Wrapped token allowance to Permit2: ${currentWrappedAllowance.toString()}`);

        // Approve to Permit2 with actual amount if needed
        if (currentWrappedAllowance < BigInt(exactAmountWrappedIn)) {
          const approveTx2 = await wrappedTokenContract.approve(
            permit2Address,
            exactAmountWrappedIn,
          );
          await approveTx2.wait();
          console.log(`Approved wrapped token to Permit2: ${exactAmountWrappedIn}`);
        }
      }

      if (
        exactAmountUnderlyingIn &&
        parseFloat(exactAmountUnderlyingIn) > 0 &&
        debouncedUnderlyingTokenAddress
      ) {
        const underlyingTokenContract = new ethers.Contract(
          debouncedUnderlyingTokenAddress,
          ERC20,
          signer,
        );

        // Check current ERC20 allowance to Permit2
        const currentAllowance = await underlyingTokenContract.allowance(
          walletAddress,
          permit2Address,
        );
        console.log(`Underlying token allowance to Permit2: ${currentAllowance.toString()}`);

        // Approve to Permit2 with actual amount if needed
        if (currentAllowance < BigInt(exactAmountUnderlyingIn)) {
          const approveTx1 = await underlyingTokenContract.approve(
            permit2Address,
            exactAmountUnderlyingIn,
          );
          await approveTx1.wait();
          console.log(`Approved underlying token to Permit2: ${exactAmountUnderlyingIn}`);
        }
      }

      // Step 3: Permit2 approvals to BufferRouter (actual amounts)
      const permit2Contract = new ethers.Contract(permit2Address, Permit2ABI, signer);

      // Calculate expiration (far in the future)
      const expiration = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year

      // Approve underlying token via Permit2 to BufferRouter
      if (
        debouncedUnderlyingTokenAddress &&
        exactAmountUnderlyingIn &&
        parseFloat(exactAmountUnderlyingIn) > 0
      ) {
        const permit2AllowanceUnderlying = await permit2Contract.allowance(
          walletAddress,
          debouncedUnderlyingTokenAddress,
          bufferRouterAddress,
        );
        console.log(
          `Permit2 allowance for underlying to BufferRouter: ${permit2AllowanceUnderlying.amount.toString()}`,
        );

        if (permit2AllowanceUnderlying.amount < BigInt(exactAmountUnderlyingIn)) {
          const permit2ApproveTx1 = await permit2Contract.approve(
            debouncedUnderlyingTokenAddress,
            bufferRouterAddress,
            exactAmountUnderlyingIn,
            expiration,
          );
          await permit2ApproveTx1.wait();
          console.log(
            `Permit2 approved underlying token to BufferRouter: ${exactAmountUnderlyingIn}`,
          );
        }
      }

      // Approve wrapped token via Permit2 to BufferRouter
      if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) > 0) {
        const permit2AllowanceWrapped = await permit2Contract.allowance(
          walletAddress,
          selectedToken.address,
          bufferRouterAddress,
        );
        console.log(
          `Permit2 allowance for wrapped to BufferRouter: ${permit2AllowanceWrapped.amount.toString()}`,
        );

        if (permit2AllowanceWrapped.amount < BigInt(exactAmountWrappedIn)) {
          const permit2ApproveTx2 = await permit2Contract.approve(
            selectedToken.address,
            bufferRouterAddress,
            exactAmountWrappedIn,
            expiration,
          );
          await permit2ApproveTx2.wait();
          console.log(`Permit2 approved wrapped token to BufferRouter: ${exactAmountWrappedIn}`);
        }
      }

      // Step 4: Execute buffer initialization
      const contract = new ethers.Contract(bufferRouterAddress, BufferRouterABI, signer);
      const tx = await contract.initializeBuffer(
        selectedToken.address, // wrappedToken
        exactAmountUnderlyingIn || "0", // exactAmountUnderlyingIn
        exactAmountWrappedIn || "0", // exactAmountWrappedIn
        minIssuedShares || "0", // minIssuedShares
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
    selectedNetwork,
    addressBook,
    includePermit2,
    debouncedUnderlyingTokenAddress,
    toast,
    getBufferRouterAddress,
  ]);

  const handleGeneratePayload = useCallback(async () => {
    // Validation
    if (!selectedNetwork || !selectedToken) {
      toast({
        title: "Missing information",
        description: "Please select a network and wrapped token",
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

    const underlyingAmount = parseFloat(exactAmountUnderlyingIn) || 0;
    const wrappedAmount = parseFloat(exactAmountWrappedIn) || 0;
    if (underlyingAmount <= 0 && wrappedAmount <= 0) {
      toast({
        title: "Missing amount",
        description:
          "At least one of Underlying Token Amount or Wrapped Token Amount must be greater than 0",
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

    const bufferRouterAddress = getBufferRouterAddress();
    if (!bufferRouterAddress) return;

    let permit2Address;
    if (includePermit2) {
      permit2Address = getPermit2Address(addressBook, selectedNetwork);
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
        minIssuedShares: minIssuedShares || "0",
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
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Buffer Initialization
              </Text>
              <Text fontSize="sm">
                • Buffer initialization is <strong>permissionless</strong> but primarily intended
                for DAOs and protocol partners
                <br />• Initialization is the{" "}
                <strong>only operation that can be done unbalanced</strong> (you can initialize with
                just underlying tokens)
                <br />• It is strongly recommended to initialize buffers{" "}
                <strong>before deploying pools</strong> with wrapped tokens
                <br />• For detailed guidance, see{" "}
                <Link
                  href="https://docs.balancer.fi/concepts/vault/buffer.html"
                  textDecoration="underline"
                  isExternal
                >
                  the buffer documentation
                </Link>
              </Text>
            </Box>
          </Flex>
        </Alert>

        {/* Execution Mode Selector */}
        <Box>
          <FormControl>
            <FormLabel>Execution Mode</FormLabel>
            <Select
              value={executionMode}
              onChange={e => setExecutionMode(e.target.value as ExecutionMode)}
              variant="outline"
              shadow="none"
            >
              <option value={ExecutionMode.EOA}>Direct Wallet Execution (EOA)</option>
              <option value={ExecutionMode.SAFE}>Safe Payload Generation</option>
            </Select>
            <Text fontSize="xs" color="gray.500" mt={1}>
              {executionMode === ExecutionMode.EOA
                ? "Execute buffer initialization directly with your connected wallet"
                : "Generate a transaction payload for Safe multisig execution"}
            </Text>
          </FormControl>
        </Box>

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

          <FormControl>
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
          {/* Safe Address - only show in Safe mode */}
          {executionMode === ExecutionMode.SAFE && (
            <FormControl mb={6}>
              <FormLabel>
                Seeding Safe Address
                <Text fontSize="xs" color="gray.500" fontWeight="normal" mt={1}>
                  Required for Safe payload generation. The Safe will become the initial shares
                  owner.
                </Text>
              </FormLabel>
              <Input
                name="seedingSafe"
                value={seedingSafe}
                onChange={e => setSeedingSafe(e.target.value)}
                placeholder="Safe multisig address"
                isDisabled={!selectedToken}
                isRequired={executionMode === ExecutionMode.SAFE}
              />
            </FormControl>
          )}

          {/* Permit2 - only show in Safe mode for payload generation */}
          {executionMode === ExecutionMode.SAFE && (
            <Box>
              <Checkbox
                size="lg"
                onChange={e => setIncludePermit2(e.target.checked)}
                isDisabled={!selectedToken}
              >
                <FormLabel mb="0">Include Permit2 approvals</FormLabel>
              </Checkbox>
            </Box>
          )}
        </Flex>

        {/* Mode-specific alerts */}
        {selectedToken && !isInitialized && (
          <Alert status={executionMode === ExecutionMode.EOA ? "success" : "info"} mt={4}>
            <AlertIcon />
            <AlertDescription>
              <Text fontWeight="semibold" mb={1}>
                {executionMode === ExecutionMode.EOA
                  ? "Direct Wallet Execution Mode"
                  : "Safe Payload Generation Mode"}
              </Text>
              {executionMode === ExecutionMode.EOA
                ? "Buffer will be initialized directly with your connected wallet. Your wallet will become the initial shares owner."
                : "A transaction payload will be generated for Safe multisig execution. Enter the Safe address in the 'Seeding Safe Address' field below."}
            </AlertDescription>
          </Alert>
        )}

        {/* Display error if buffer is already initialized */}
        {selectedToken && selectedNetwork && isInitialized && (
          <Alert status="error" alignItems="center">
            <AlertIcon />
            <AlertDescription>
              <Text fontWeight="semibold">This buffer is already initialized.</Text>
              <Text fontSize="sm" mt={1}>
                You cannot initialize it again. Use the &quot;Manage Buffer&quot; tool to add or
                liquidity.
              </Text>
            </AlertDescription>
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
            ) : executionMode === ExecutionMode.EOA && walletAddress ? (
              // EOA Mode: Show Execute and Wrap Tokens buttons
              <>
                <Button
                  variant="primary"
                  onClick={handleDirectBufferInitialization}
                  isDisabled={isGenerateButtonDisabled}
                >
                  Execute Initialize Buffer
                </Button>
                {exactAmountUnderlyingIn && parseFloat(exactAmountUnderlyingIn) > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleWrapTokens}
                    isDisabled={!selectedToken || !exactAmountUnderlyingIn}
                  >
                    Wrap Tokens
                  </Button>
                )}
              </>
            ) : (
              // Safe Mode: Show only Generate Payload button
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
          {executionMode === ExecutionMode.SAFE && generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
          {executionMode === ExecutionMode.EOA &&
            selectedToken &&
            !isInitialized &&
            walletAddress && (
              <SimulateEOATransactionButton
                transactions={
                  selectedToken && selectedNetwork
                    ? buildInitializeBufferSimulationTransactions({
                        selectedToken,
                        selectedNetwork,
                        exactAmountWrappedIn,
                        exactAmountUnderlyingIn,
                        underlyingTokenAddress: debouncedUnderlyingTokenAddress,
                        minIssuedShares,
                        addressBook,
                      }) || []
                    : []
                }
                networkId={NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork)?.chainId || "1"}
                disabled={isGenerateButtonDisabled}
              />
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
