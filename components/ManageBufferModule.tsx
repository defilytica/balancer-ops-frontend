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
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import {
  getPermit2Address,
  getBufferRouterAddress as getBufferRouterAddressForNetwork,
  getVaultAddress as getVaultAddressForNetwork,
} from "@/lib/utils/sonicNetworkUtils";
import { GetTokensDocument } from "@/lib/services/apollo/generated/graphql";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";
import { fetchBufferInitializationStatus } from "@/lib/services/fetchBufferInitializationStatus";
import { fetchBufferOwnerShares } from "@/lib/services/fetchBufferOwnerShares";
import { fetchBufferTotalShares } from "@/lib/services/fetchBufferTotalShares";
import { fetchBufferAsset } from "@/lib/services/fetchBufferAsset";
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
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { isAddress } from "viem";
import { isZeroAddress } from "@ethereumjs/util";
import SimulateTransactionButton from "./btns/SimulateTransactionButton";
import SimulateEOATransactionButton from "./btns/SimulateEOATransactionButton";
import { NetworkSelector } from "@/components/NetworkSelector";
import { buildManageBufferSimulationTransactions } from "@/app/payload-builder/simulationHelperFunctions";
import { BufferOperation } from "@/types/interfaces";
import ComposerButton from "@/app/payload-builder/composer/ComposerButton";
import ComposerIndicator from "@/app/payload-builder/composer/ComposerIndicator";
import { useAccount, useSwitchChain, useBalance } from "wagmi";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { V3vaultAdmin } from "@/abi/v3vaultAdmin";
import { ERC20 } from "@/abi/erc20";
import BufferRouterABI from "@/abi/BufferRouter.json";
import Permit2ABI from "@/abi/Permit2.json";

interface ManageBufferModuleProps {
  addressBook: AddressBook;
}

enum ExecutionMode {
  SAFE = "safe",
  EOA = "eoa",
}

export default function ManageBufferModule({ addressBook }: ManageBufferModuleProps) {
  const searchParams = useSearchParams();
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(ExecutionMode.EOA);
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

  // Chain state switch
  const { switchChain } = useSwitchChain();

  // Add wallet connection hook
  const { address: walletAddress } = useAccount();

  // Extract token address from URL for efficient querying
  const tokenParamFromUrl = useMemo(() => {
    const tokenParam = searchParams.get("token");
    return tokenParam && isAddress(tokenParam) ? tokenParam : null;
  }, [searchParams]);

  // Query for specific token from URL parameter
  const { data: urlTokenData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
    GetTokensDocument,
    {
      variables: {
        chainIn: [selectedNetwork],
        tokensIn: tokenParamFromUrl ? [tokenParamFromUrl] : [],
      },
      skip: !selectedNetwork || !tokenParamFromUrl,
      context: {
        uri:
          selectedNetwork === "SEPOLIA"
            ? "https://test-api-v3.balancer.fi/"
            : "https://api-v3.balancer.fi/",
      },
    },
  );

  // Query for underlying token data (when we have a selected token)
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
    return NETWORK_OPTIONS.filter(
      network =>
        networksWithV3.includes(network.apiID.toLowerCase()) ||
        network.apiID.toLowerCase() === "sonic",
    );
  }, [addressBook]);

  // Handle URL parameters for network
  useEffect(() => {
    const networkParam = searchParams.get("network");

    if (networkParam && !selectedNetwork) {
      const networkOption = networkOptionsWithV3.find(
        n => n.apiID.toLowerCase() === networkParam.toLowerCase(),
      );
      if (networkOption) {
        setSelectedNetwork(networkOption.apiID);
      }
    }
  }, [searchParams, selectedNetwork, networkOptionsWithV3]);

  // Separate effect for token selection (waits for data to load)
  useEffect(() => {
    if (tokenParamFromUrl && !selectedToken && selectedNetwork && urlTokenData?.tokenGetTokens) {
      if (urlTokenData.tokenGetTokens.length > 0) {
        const apiToken = urlTokenData.tokenGetTokens[0];
        handleTokenSelect(apiToken);
      }
    }
  }, [tokenParamFromUrl, selectedToken, selectedNetwork, urlTokenData]);

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

  // Fetch buffer owner shares (for Safe payload generation)
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

  // Fetch connected wallet shares (for EOA direct execution)
  const {
    data: walletShares,
    isLoading: isLoadingWalletShares,
    isError: isWalletSharesError,
  } = useTanStackQuery({
    queryKey: ["walletShares", selectedToken?.address, walletAddress, selectedNetwork],
    queryFn: () =>
      fetchBufferOwnerShares(selectedToken!.address, walletAddress!, selectedNetwork.toLowerCase()),
    enabled:
      !!selectedToken &&
      !!selectedNetwork &&
      !!networks[selectedNetwork.toLowerCase()] &&
      !!walletAddress &&
      isAddress(walletAddress),
  });

  // Fetch buffer initialization status
  const { data: isInitialized, isLoading: isLoadingInitialized } = useTanStackQuery({
    queryKey: ["bufferInitialized", selectedToken?.address, selectedNetwork],
    queryFn: () =>
      fetchBufferInitializationStatus(selectedToken!.address, selectedNetwork.toLowerCase()),
    enabled: !!selectedToken && !!selectedNetwork && !!networks[selectedNetwork.toLowerCase()],
  });

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

  const underlyingTokenAddress = useMemo(() => {
    if (!selectedToken) return undefined;
    return selectedToken.isManual
      ? bufferAsset?.underlyingToken && !isZeroAddress(bufferAsset.underlyingToken)
        ? bufferAsset.underlyingToken
        : selectedToken.underlyingTokenAddress
      : selectedToken.underlyingTokenAddress;
  }, [selectedToken, bufferAsset]);

  // Fetch wallet balance for underlying token
  const { data: walletUnderlyingBalance } = useBalance({
    address: walletAddress as `0x${string}` | undefined,
    token: underlyingTokenAddress as `0x${string}` | undefined,
    query: {
      enabled: !!walletAddress && !!underlyingTokenAddress,
    },
  });

  // Fetch wallet balance for wrapped token
  const { data: walletWrappedBalance } = useBalance({
    address: walletAddress as `0x${string}` | undefined,
    token: selectedToken?.address as `0x${string}` | undefined,
    query: {
      enabled: !!walletAddress && !!selectedToken?.address,
    },
  });

  // Auto-switch to Safe mode when wallet is not connected
  useEffect(() => {
    if (!walletAddress && executionMode === ExecutionMode.EOA) {
      setExecutionMode(ExecutionMode.SAFE);
    }
  }, [walletAddress, executionMode]);

  // Get buffer router address with validation
  const getBufferRouterAddress = useCallback(() => {
    if (!selectedNetwork) return null;

    const bufferRouterAddress = getBufferRouterAddressForNetwork(addressBook, selectedNetwork);

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

  // Get vault address with validation
  const getVaultAddress = useCallback(() => {
    if (!selectedNetwork) return null;

    const vaultAddress = getVaultAddressForNetwork(addressBook, selectedNetwork);

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

    return vaultAddress;
  }, [selectedNetwork, addressBook, toast]);

  const isGenerateButtonDisabled = useMemo(() => {
    return (
      !selectedNetwork ||
      !selectedToken ||
      !sharesAmount ||
      (!underlyingTokenAmount && !wrappedTokenAmount) ||
      !isInitialized
    );
  }, [
    selectedNetwork,
    selectedToken,
    sharesAmount,
    underlyingTokenAmount,
    wrappedTokenAmount,
    isInitialized,
  ]);

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
    setUnderlyingTokenAmount("");
    setWrappedTokenAmount("");
    setSharesAmount("");
  };

  const handleRemoveLiquidity = useCallback(
    (chainId: string) => {
      const vaultAddress = getVaultAddress();
      if (!vaultAddress) return null;

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
      getVaultAddress,
      selectedToken,
      sharesAmount,
      underlyingTokenAmount,
      wrappedTokenAmount,
      ownerSafe,
    ],
  );

  const handleAddLiquidity = useCallback(
    (chainId: string) => {
      const bufferRouterAddress = getBufferRouterAddress();
      if (!bufferRouterAddress) return null;

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
          return null;
        }
      }

      return generateAddLiquidityToBufferPayload(
        {
          wrappedToken: selectedToken!.address,
          underlyingToken: selectedToken!.isManual
            ? bufferAsset?.underlyingToken && !isZeroAddress(bufferAsset.underlyingToken)
              ? bufferAsset.underlyingToken
              : selectedToken!.underlyingTokenAddress
            : selectedToken!.underlyingTokenAddress,
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
      getBufferRouterAddress,
      selectedToken,
      underlyingTokenAmount,
      wrappedTokenAmount,
      sharesAmount,
      ownerSafe,
      includePermit2,
      bufferAsset,
      addressBook,
      selectedNetwork,
      toast,
    ],
  );

  // Direct transaction execution for EOA with proper permit2 flow
  const handleDirectAddLiquidity = useCallback(async () => {
    try {
      if (!selectedToken || !sharesAmount) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Buffers require proportional liquidity (both underlying and wrapped tokens)
      if (
        !underlyingTokenAmount ||
        parseFloat(underlyingTokenAmount) === 0 ||
        !wrappedTokenAmount ||
        parseFloat(wrappedTokenAmount) === 0
      ) {
        toast({
          title: "Proportional liquidity required",
          description:
            "Buffers require both underlying and wrapped tokens in proportion. You need to wrap some underlying tokens first using the ERC4626 token's deposit function, then try again with both token types.",
          status: "error",
          duration: 10000,
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

      if (wrappedTokenAmount && parseFloat(wrappedTokenAmount) > 0) {
        const wrappedTokenContract = new ethers.Contract(selectedToken.address, ERC20, signer);
        const wrappedBalance = await wrappedTokenContract.balanceOf(walletAddress);
        console.log(
          `Wrapped token balance: ${wrappedBalance.toString()}, needed: ${wrappedTokenAmount}`,
        );

        if (wrappedBalance < BigInt(wrappedTokenAmount)) {
          toast({
            title: "Insufficient wrapped token balance",
            description: `You have ${wrappedBalance.toString()} but need ${wrappedTokenAmount}`,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          return;
        }
      }

      if (
        underlyingTokenAmount &&
        parseFloat(underlyingTokenAmount) > 0 &&
        underlyingTokenAddress
      ) {
        const underlyingTokenContract = new ethers.Contract(underlyingTokenAddress, ERC20, signer);
        const balance = await underlyingTokenContract.balanceOf(walletAddress);
        console.log(
          `Underlying token balance: ${balance.toString()}, needed: ${underlyingTokenAmount}`,
        );

        if (balance < BigInt(underlyingTokenAmount)) {
          toast({
            title: "Insufficient underlying token balance",
            description: `You have ${balance.toString()} but need ${underlyingTokenAmount}`,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          return;
        }
      }

      // Step 2: Handle token approvals to Permit2 (actual amounts)

      if (wrappedTokenAmount && parseFloat(wrappedTokenAmount) > 0) {
        const wrappedTokenContract = new ethers.Contract(selectedToken.address, ERC20, signer);

        // Check current ERC20 allowance to Permit2
        const currentWrappedAllowance = await wrappedTokenContract.allowance(
          walletAddress,
          permit2Address,
        );
        console.log(`Wrapped token allowance to Permit2: ${currentWrappedAllowance.toString()}`);

        // Approve to Permit2 with actual amount if needed
        if (currentWrappedAllowance < BigInt(wrappedTokenAmount)) {
          const approveTx2 = await wrappedTokenContract.approve(permit2Address, wrappedTokenAmount);
          await approveTx2.wait();
          console.log(`Approved wrapped token to Permit2: ${wrappedTokenAmount}`);
        }
      }

      if (
        underlyingTokenAmount &&
        parseFloat(underlyingTokenAmount) > 0 &&
        underlyingTokenAddress
      ) {
        const underlyingTokenContract = new ethers.Contract(underlyingTokenAddress, ERC20, signer);

        // Check current ERC20 allowance to Permit2
        const currentAllowance = await underlyingTokenContract.allowance(
          walletAddress,
          permit2Address,
        );
        console.log(`Underlying token allowance to Permit2: ${currentAllowance.toString()}`);

        // Approve to Permit2 with actual amount if needed
        if (currentAllowance < BigInt(underlyingTokenAmount)) {
          const approveTx1 = await underlyingTokenContract.approve(
            permit2Address,
            underlyingTokenAmount,
          );
          await approveTx1.wait();
          console.log(`Approved underlying token to Permit2: ${underlyingTokenAmount}`);
        }
      }

      // Step 3: Permit2 approvals to BufferRouter (actual amounts)
      const permit2Contract = new ethers.Contract(permit2Address, Permit2ABI, signer);

      // Calculate expiration (far in the future)
      const expiration = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year

      // Approve underlying token via Permit2 to BufferRouter
      if (
        underlyingTokenAddress &&
        underlyingTokenAmount &&
        parseFloat(underlyingTokenAmount) > 0
      ) {
        const permit2AllowanceUnderlying = await permit2Contract.allowance(
          walletAddress,
          underlyingTokenAddress,
          bufferRouterAddress,
        );
        console.log(
          `Permit2 allowance for underlying to BufferRouter: ${permit2AllowanceUnderlying.amount.toString()}`,
        );

        if (permit2AllowanceUnderlying.amount < BigInt(underlyingTokenAmount)) {
          const permit2ApproveTx1 = await permit2Contract.approve(
            underlyingTokenAddress,
            bufferRouterAddress,
            underlyingTokenAmount,
            expiration,
          );
          await permit2ApproveTx1.wait();
          console.log(
            `Permit2 approved underlying token to BufferRouter: ${underlyingTokenAmount}`,
          );
        }
      }

      // Approve wrapped token via Permit2 to BufferRouter
      if (wrappedTokenAmount && parseFloat(wrappedTokenAmount) > 0) {
        const permit2AllowanceWrapped = await permit2Contract.allowance(
          walletAddress,
          selectedToken.address,
          bufferRouterAddress,
        );
        console.log(
          `Permit2 allowance for wrapped to BufferRouter: ${permit2AllowanceWrapped.amount.toString()}`,
        );

        if (permit2AllowanceWrapped.amount < BigInt(wrappedTokenAmount)) {
          const permit2ApproveTx2 = await permit2Contract.approve(
            selectedToken.address,
            bufferRouterAddress,
            wrappedTokenAmount,
            expiration,
          );
          await permit2ApproveTx2.wait();
          console.log(`Permit2 approved wrapped token to BufferRouter: ${wrappedTokenAmount}`);
        }
      }

      // Step 4: Execute add liquidity to buffer
      const contract = new ethers.Contract(bufferRouterAddress, BufferRouterABI, signer);

      console.log(`Calling addLiquidityToBuffer with:`);
      console.log(`  wrappedToken: ${selectedToken.address}`);
      console.log(`  maxAmountUnderlyingIn: ${underlyingTokenAmount || "0"}`);
      console.log(`  maxAmountWrappedIn: ${wrappedTokenAmount || "0"}`);
      console.log(`  exactSharesToIssue: ${sharesAmount}`);
      console.log(`  BufferRouter address: ${bufferRouterAddress}`);

      const tx = await contract.addLiquidityToBuffer(
        selectedToken.address, // wrappedToken
        underlyingTokenAmount || "0", // maxAmountUnderlyingIn
        wrappedTokenAmount || "0", // maxAmountWrappedIn
        sharesAmount, // exactSharesToIssue
      );

      toast.promise(tx.wait(), {
        success: {
          title: "Success",
          description: `Liquidity added to buffer successfully. Changes will appear in the UI in the next few minutes after the block is indexed.`,
          duration: 5000,
          isClosable: true,
        },
        loading: {
          title: "Adding liquidity to buffer",
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
    underlyingTokenAmount,
    wrappedTokenAmount,
    sharesAmount,
    walletAddress,
    getBufferRouterAddress,
    bufferAsset,
    includePermit2,
    addressBook,
    selectedNetwork,
    toast,
    underlyingTokenAddress,
  ]);

  // Function to wrap underlying tokens to wrapped tokens
  const handleWrapTokens = useCallback(async () => {
    try {
      if (!selectedToken || !underlyingTokenAmount) {
        toast({
          title: "Missing information",
          description: "Please select a token and enter an underlying token amount to wrap",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (!underlyingTokenAddress) {
        toast({
          title: "Missing underlying token address",
          description: "Cannot determine underlying token address",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Step 1: Approve wrapped token to spend underlying tokens
      const underlyingTokenContract = new ethers.Contract(underlyingTokenAddress, ERC20, signer);

      const currentAllowance = await underlyingTokenContract.allowance(
        walletAddress,
        selectedToken.address, // wrapped token address
      );

      if (currentAllowance < BigInt(underlyingTokenAmount)) {
        const approveTx = await underlyingTokenContract.approve(
          selectedToken.address, // wrapped token address
          underlyingTokenAmount,
        );
        await approveTx.wait();
        console.log(`Approved wrapped token to spend underlying tokens: ${underlyingTokenAmount}`);
      }

      // Step 2: Deposit/wrap the tokens
      const wrappedTokenContract = new ethers.Contract(
        selectedToken.address,
        ["function deposit(uint256 assets, address receiver) external returns (uint256 shares)"],
        signer,
      );

      const wrapTx = await wrappedTokenContract.deposit(
        underlyingTokenAmount,
        walletAddress, // recipient
      );

      toast.promise(wrapTx.wait(), {
        success: {
          title: "Success",
          description: `Tokens wrapped successfully! You now have wrapped tokens.`,
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
    underlyingTokenAmount,
    walletAddress,
    bufferAsset,
    toast,
    underlyingTokenAddress,
  ]);

  const handleDirectRemoveLiquidity = useCallback(async () => {
    try {
      if (!selectedToken || !sharesAmount) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const vaultAddress = getVaultAddress();
      if (!vaultAddress) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(vaultAddress, V3vaultAdmin, signer);

      const tx = await contract.removeLiquidityFromBuffer(
        selectedToken.address,
        sharesAmount,
        underlyingTokenAmount || "0",
        wrappedTokenAmount || "0",
      );

      toast.promise(tx.wait(), {
        success: {
          title: "Success",
          description: `Liquidity removed from buffer successfully. Changes will appear in the UI in the next few minutes after the block is indexed.`,
          duration: 5000,
          isClosable: true,
        },
        loading: {
          title: "Removing liquidity from buffer",
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
    sharesAmount,
    underlyingTokenAmount,
    wrappedTokenAmount,
    getVaultAddress,
    toast,
  ]);

  const handleGeneratePayload = useCallback(async () => {
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

    // Always generate payload
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

  const handleDirectExecution = useCallback(async () => {
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

    // Execute directly via wallet
    if (operationType === BufferOperation.ADD) {
      await handleDirectAddLiquidity();
    } else {
      await handleDirectRemoveLiquidity();
    }
  }, [
    selectedNetwork,
    selectedToken,
    sharesAmount,
    underlyingTokenAmount,
    wrappedTokenAmount,
    operationType,
    handleDirectAddLiquidity,
    handleDirectRemoveLiquidity,
    toast,
  ]);

  // Generate composer data only when button is clicked
  const generateComposerData = useCallback(() => {
    if (!generatedPayload) return null;

    const payload =
      typeof generatedPayload === "string" ? JSON.parse(generatedPayload) : generatedPayload;

    // Check if this is a remove operation by looking at contractMethod.name
    const isRemoveOperation =
      payload.transactions[payload.transactions.length - 1].contractMethod.name ===
      "removeLiquidityFromBuffer";

    if (isRemoveOperation) {
      // For remove operations, we only have encoded data, so minimal params
      return {
        type: "manage-buffer",
        title: "Remove Buffer Liquidity",
        description: payload.meta.description,
        payload: payload,
        params: {
          operation: "remove",
        },
        builderPath: "manage-buffer",
      };
    } else {
      // For add operations, we have contractInputsValues
      let wrappedToken =
        payload.transactions[payload.transactions.length - 1].contractInputsValues.wrappedToken;
      let exactSharesToIssue =
        payload.transactions[payload.transactions.length - 1].contractInputsValues
          .exactSharesToIssue;

      return {
        type: "manage-buffer",
        title: "Add Buffer Liquidity",
        description: payload.meta.description,
        payload: payload,
        params: {
          operation: "add",
          wrappedToken: wrappedToken,
          exactSharesToIssue: exactSharesToIssue,
        },
        builderPath: "manage-buffer",
      };
    }
  }, [generatedPayload, selectedToken]);

  return (
    <Container maxW="container.lg" mx="auto" p={4}>
      <VStack spacing={4} align="stretch">
        <Flex justifyContent="space-between" direction={{ base: "column", md: "row" }} gap={4}>
          <Heading as="h2" size="lg" variant="special">
            Manage Liquidity Buffer
          </Heading>
          <Box width={{ base: "full", md: "auto" }}>
            <ComposerIndicator />
          </Box>
        </Flex>
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
        <Box width="calc(50% - 8px)">
          <FormControl>
            <FormLabel>Operation Type</FormLabel>
            <Select
              value={operationType}
              onChange={e => {
                setOperationType(e.target.value as BufferOperation);
              }}
              variant="outline"
              shadow="none"
            >
              <option value={BufferOperation.ADD}>Add Liquidity</option>
              <option value={BufferOperation.REMOVE}>Remove Liquidity</option>
            </Select>
          </FormControl>
        </Box>

        {/* Execution Mode Selector */}
        <Box width="calc(50% - 8px)">
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
                ? "Execute buffer operations directly with your connected wallet"
                : "Generate transaction payloads for Safe multisig execution"}
            </Text>
          </FormControl>
        </Box>

        <Flex direction={{ base: "column", md: "row" }} gap={4}>
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
                allowManualInput={true}
              />
              {selectedToken && (
                <Text fontSize="sm" mt={1.5} color="gray.400">
                  {selectedToken.isManual &&
                  bufferAsset &&
                  !isZeroAddress(bufferAsset.underlyingToken)
                    ? `Underlying token: ${bufferAsset.underlyingToken}`
                    : underlyingToken
                      ? `Underlying token: ${underlyingToken.address} (${underlyingToken.symbol})`
                      : null}
                </Text>
              )}
            </FormControl>
          </Box>
        </Flex>

        <Flex direction={{ base: "column", md: "row" }} gap={4}>
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
                        Buffer: {bufferBalance.wrappedBalance.toString()}
                        {!selectedToken?.isManual && (
                          <Text fontSize="sm" as="span" color="gray.450">
                            {" "}
                            ≈ {formatValue(
                              bufferBalance.wrappedBalance,
                              selectedToken.decimals,
                            )}{" "}
                            {selectedToken.symbol}
                          </Text>
                        )}
                      </Text>
                      {/* Show wallet balance if connected and in EOA mode */}
                      {walletAddress &&
                        walletWrappedBalance &&
                        executionMode === ExecutionMode.EOA && (
                          <Text fontSize="sm">
                            Wallet: {walletWrappedBalance.value.toString()}
                            {!selectedToken?.isManual && (
                              <Text fontSize="sm" as="span">
                                {" "}
                                ≈ {formatValue(
                                  walletWrappedBalance.value,
                                  selectedToken.decimals,
                                )}{" "}
                                {selectedToken.symbol}
                              </Text>
                            )}
                          </Text>
                        )}
                    </Flex>
                  )
                )}
              </>
            )}
          </FormControl>

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
                        Buffer: {bufferBalance.underlyingBalance.toString()}
                        {!selectedToken?.isManual && (
                          <Text fontSize="sm" as="span" color="gray.450">
                            {" "}
                            ≈{" "}
                            {formatValue(
                              bufferBalance.underlyingBalance,
                              underlyingToken?.decimals ?? selectedToken.decimals,
                            )}{" "}
                            {underlyingToken?.symbol ?? "tokens"}
                          </Text>
                        )}
                      </Text>
                      {/* Show wallet balance if connected and in EOA mode */}
                      {walletAddress &&
                        walletUnderlyingBalance &&
                        executionMode === ExecutionMode.EOA && (
                          <Text fontSize="sm">
                            Wallet: {walletUnderlyingBalance.value.toString()}
                            {!selectedToken?.isManual && (
                              <Text as="span" fontSize="sm">
                                {" "}
                                ≈{" "}
                                {formatValue(
                                  walletUnderlyingBalance.value,
                                  underlyingToken?.decimals ?? selectedToken.decimals,
                                )}{" "}
                                {underlyingToken?.symbol ?? "tokens"}
                              </Text>
                            )}
                          </Text>
                        )}
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
                        {!selectedToken?.isManual && (
                          <Text fontSize="sm" as="span" color="gray.450">
                            {" "}
                            ≈{" "}
                            {formatValue(
                              bufferShares.shares,
                              underlyingToken?.decimals ?? selectedToken.decimals,
                            )}
                          </Text>
                        )}
                      </Text>
                    </Flex>
                  )
                )}
              </>
            )}
          </FormControl>
        </Flex>

        <Flex direction="column" width={{ base: "100%", md: "50%" }} minW={{ md: "300px" }}>
          {/* Safe Address - only show in Safe mode */}
          {executionMode === ExecutionMode.SAFE && (
            <FormControl mb={6}>
              <FormLabel>
                Shares Owner Safe Address
                <Text fontSize="xs" color="gray.500" fontWeight="normal" mt={1}>
                  Required for Safe payload generation. The Safe will be the shares owner/manager.
                </Text>
              </FormLabel>
              <InputGroup>
                <Input
                  name="ownerSafe"
                  value={ownerSafe}
                  onChange={e => setOwnerSafe(e.target.value)}
                  placeholder="Safe multisig address"
                  isDisabled={!selectedToken}
                  isRequired={executionMode === ExecutionMode.SAFE}
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
                            Safe balance: {ownerShares.ownerShares.toString()}
                          </Text>
                          {!selectedToken?.isManual && (
                            <Text fontSize="xs" color="gray.500">
                              ≈{" "}
                              {formatValue(
                                ownerShares.ownerShares,
                                underlyingToken?.decimals ?? selectedToken.decimals,
                              )}
                            </Text>
                          )}
                        </Flex>
                      </>
                    )
                  )}
                </>
              )}
            </FormControl>
          )}

          {/* Permit2 - only show in Safe mode for ADD operations */}
          {executionMode === ExecutionMode.SAFE && operationType === BufferOperation.ADD && (
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
        {selectedToken && (
          <Alert status={executionMode === ExecutionMode.EOA ? "success" : "info"} mt={4}>
            <AlertIcon />
            <AlertDescription>
              <Text fontWeight="semibold" mb={1}>
                {executionMode === ExecutionMode.EOA
                  ? "Direct Wallet Execution Mode"
                  : "Safe Payload Generation Mode"}
              </Text>
              {executionMode === ExecutionMode.EOA
                ? `Buffer ${operationType === BufferOperation.ADD ? "liquidity will be added" : "liquidity will be removed"} directly with your connected wallet.`
                : `A transaction payload will be generated for Safe multisig execution. ${operationType === BufferOperation.REMOVE ? "Ensure the Safe address owns shares in this buffer." : ""}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Show wallet shares status for remove operations */}
        {operationType === BufferOperation.REMOVE &&
          selectedToken &&
          walletAddress &&
          !isLoadingWalletShares && (
            <Alert
              status={walletShares && walletShares.ownerShares > BigInt(0) ? "info" : "warning"}
              mt={2}
            >
              <AlertIcon />
              <AlertDescription fontSize="sm">
                <Text>
                  <Text as="span" fontWeight="semibold">
                    Your wallet shares:
                  </Text>{" "}
                  {isWalletSharesError
                    ? "Failed to load"
                    : walletShares
                      ? walletShares.ownerShares.toString()
                      : "0"}
                </Text>
              </AlertDescription>
            </Alert>
          )}

        {/* Show safe address shares status */}
        {operationType === BufferOperation.REMOVE &&
          ownerShares?.ownerShares === BigInt(0) &&
          isAddress(ownerSafe) &&
          selectedToken && (
            <Alert status="error" alignItems="center" mt={2}>
              <AlertIcon />
              <Text fontSize="sm">
                <Text as="span" fontWeight="semibold">
                  Safe address shares:
                </Text>{" "}
                This address ({ownerSafe.slice(0, 6)}...{ownerSafe.slice(-4)}) has no shares in this
                buffer.
              </Text>
            </Alert>
          )}

        {selectedToken && !isLoadingInitialized && !isInitialized && (
          <Alert status="error" alignItems="center">
            <AlertIcon />
            <Text>
              <b>This buffer is not initialized.</b> You need to initialize the buffer before you
              can manage it.
            </Text>
          </Alert>
        )}

        <Flex justifyContent="space-between" alignItems="center" mt="5" mb="2" wrap="wrap" gap={2}>
          <Flex gap={2} align="center">
            {!selectedToken ? (
              <Button variant="primary" isDisabled={true}>
                Select a Token
              </Button>
            ) : executionMode === ExecutionMode.EOA && walletAddress ? (
              // EOA Mode: Show Execute and Wrap Tokens buttons
              <>
                <Button
                  variant="primary"
                  onClick={handleDirectExecution}
                  isDisabled={isGenerateButtonDisabled}
                >
                  Execute {operationType === BufferOperation.ADD ? "Add" : "Remove"} Liquidity
                </Button>
                {operationType === BufferOperation.ADD &&
                  underlyingTokenAmount &&
                  parseFloat(underlyingTokenAmount) > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleWrapTokens}
                      isDisabled={!selectedToken || !underlyingTokenAmount}
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
                  isDisabled={!generatedPayload}
                />
              </>
            )}
          </Flex>
          {executionMode === ExecutionMode.SAFE && generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
          {executionMode === ExecutionMode.EOA &&
            selectedToken &&
            isInitialized &&
            walletAddress && (
              <SimulateEOATransactionButton
                transactions={
                  selectedToken && selectedNetwork && sharesAmount
                    ? buildManageBufferSimulationTransactions({
                        selectedToken,
                        selectedNetwork,
                        sharesAmount,
                        operationType,
                        wrappedTokenAmount,
                        underlyingTokenAmount,
                        underlyingTokenAddress,
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
