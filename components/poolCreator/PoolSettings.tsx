import {
  FormControl,
  FormLabel,
  Input,
  Stack,
  Switch,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  InputGroup,
  InputRightAddon,
  ButtonGroup,
  Button,
  HStack,
  Icon,
  RadioGroup,
  Radio,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useState, useCallback, useEffect } from "react";
import { CreateComposableABI } from "@/abi/ComposableStableFactory";
import { CreateWeightedABI } from "@/abi/WeightedPoolFactory";
import { vaultABI } from "@/abi/BalVault";
import { composablePool } from "@/abi/ComposablePool";
import { weightedPool } from "@/abi/WeightedPool";
import {
  FactoryAddressComposable,
  FactoryAddressWeighted,
  GOVERNANCE_ADDRESS,
  PRESET_FEES,
  VAULT_ADDRESS,
} from "@/constants/constants";
import { InfoIcon } from "@chakra-ui/icons";
import { PoolSettings, StablePoolSpecific, WeightedPoolSpecific } from "@/types/interfaces";
import { PoolConfig } from "@/types/interfaces";
import { getNetworkString } from "@/lib/utils/getNetworkString";
import { ethers } from "ethers";
import { ERC20 } from "@/abi/erc20";
import { InitJoinModal } from "./InitJoinModal";
import { ApprovalModal } from "./ApprovalModal";
import { LiquidityAddedModal } from "./LiquidityAddedModal";

interface PoolSettingsProps {
  config: PoolConfig;
  setConfig: (config: PoolConfig) => void;
  onSettingsUpdate: (settings: PoolSettings) => void;
  readOnly?: boolean;
  skipCreate?: boolean;
}

interface TokenApprovalState {
  checking: boolean;
  needsApproval: boolean;
  approved: boolean;
  decimals?: number;
  error?: string;
}

type NetworkString = ReturnType<typeof getNetworkString>;
type ApprovalStates = Record<string, TokenApprovalState>;

export const PoolSettingsComponent = ({
  config,
  setConfig,
  onSettingsUpdate,
  readOnly = false,
}: PoolSettingsProps) => {
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [isLiquidityAddedModalOpen, setIsLiquidityAddedModalOpen] = useState<boolean>(false);
  const [approvalStates, setApprovalStates] = useState<ApprovalStates>({});
  const [isCreatingPool, setIsCreatingPool] = useState<boolean>(false);
  const [isJoiningPool, setIsJoiningPool] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [currentNetworkName, setCurrentNetworkName] = useState<string>("");
  const [settings, setSettings] = useState<PoolSettings>(() => ({
    swapFee: 0.1,
    name: "",
    symbol: "",
    ...(config.type === "weighted"
      ? {
          weightedSpecific: {
            feeManagement: {
              type: "governance",
              owner: GOVERNANCE_ADDRESS,
            },
          },
        }
      : {
          stableSpecific: {
            amplificationParameter: 100,
            rateCacheDuration: "60", // Default 1 minute
            yieldFeeExempt: false,
            feeManagement: {
              type: "governance",
              owner: GOVERNANCE_ADDRESS,
            },
          },
        }),
    ...config.settings,
  }));
  const toast = useToast();

  console.log(config);

  useEffect(() => {
    if (!readOnly) {
      onSettingsUpdate(settings);
    }
  }, [onSettingsUpdate, settings, readOnly]);

  const getFeeManagement = () => {
    if (config.type === "weighted") {
      return settings.weightedSpecific?.feeManagement;
    }
    return settings.stableSpecific?.feeManagement;
  };

  const updateSettings = useCallback(
    (field: string, value: any) => {
      if (readOnly) return;

      setSettings(prev => {
        const newSettings = { ...prev, [field]: value };
        return newSettings;
      });
    },
    [readOnly],
  );

  const handleFeeManagementChange = useCallback(
    (type: "fixed" | "governance" | "custom") => {
      if (readOnly) return;

      setSettings(prev => {
        const feeManagement = {
          type,
          customOwner: type === "custom" ? "" : undefined,
          owner: type === "governance" ? GOVERNANCE_ADDRESS : undefined,
        };

        if (config.type === "weighted" && prev.weightedSpecific) {
          return {
            ...prev,
            weightedSpecific: {
              ...prev.weightedSpecific,
              feeManagement,
            },
          };
        } else if (prev.stableSpecific) {
          return {
            ...prev,
            stableSpecific: {
              ...prev.stableSpecific,
              feeManagement,
            },
          };
        }
        return prev;
      });
    },
    [readOnly],
  );

  const updateStableSettings = useCallback(
    (field: keyof StablePoolSpecific, value: any) => {
      if (readOnly) return;

      setSettings(prev => {
        if (!prev.stableSpecific) return prev;
        return {
          ...prev,
          stableSpecific: {
            ...prev.stableSpecific,
            [field]: value,
          },
        };
      });
    },
    [readOnly],
  );

  // Check token decimals and store them
  const checkDecimals = async (tokenAddress: string): Promise<number> => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
    try {
      return await tokenContract.decimals();
    } catch (error) {
      console.error("Error getting decimals:", error);
      return 18; // Default to 18 if there's an error
    }
  };

  const handleApprove = async (tokenAddress: string): Promise<void> => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);

    try {
      const tx = await tokenContract.approve(VAULT_ADDRESS, ethers.MaxUint256);

      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          ...prev[tokenAddress],
          checking: true,
          error: undefined,
        },
      }));

      await tx.wait();

      // Verify the approval
      const token = config.tokens.find(t => t.address === tokenAddress);
      if (token && token.amount) {
        const decimals = approvalStates[tokenAddress]?.decimals || 18;
        const isApproved = await checkApproval(tokenAddress, token.amount, decimals);

        setApprovalStates(prev => ({
          ...prev,
          [tokenAddress]: {
            ...prev[tokenAddress],
            checking: false,
            approved: isApproved,
            needsApproval: !isApproved,
          },
        }));
      }
    } catch (error) {
      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          ...prev[tokenAddress],
          checking: false,
          error: "Failed to approve token",
        },
      }));

      toast({
        title: "Error",
        description: "Failed to approve token",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Check if token amount is approved
  const checkApproval = async (
    tokenAddress: string,
    amount: string,
    decimals: number,
  ): Promise<boolean> => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
    const requiredAmount = ethers.parseUnits(amount || "0", decimals);

    try {
      const allowance = await tokenContract.allowance(userAddress, VAULT_ADDRESS);
      return Number(allowance) >= requiredAmount;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  const handleCreatePool = async (): Promise<void> => {
    setIsCreatingPool(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const networkName = getNetworkString(Number(network.chainId));
      setCurrentNetworkName(networkName);

      const newPoolId =
        config.type === "weighted"
          ? await createWeightedPool(provider, networkName, config)
          : await createComposableStablePool(provider, networkName, config);

      // Only show success and open join modal if pool was actually created
      if (newPoolId) {
        toast({
          title: "Success",
          description: `Pool created successfully! Pool ID: ${newPoolId}`,
          status: "success",
          duration: 5000,
        });
        setIsJoinModalOpen(true);
      }
    } catch (error: any) {
      console.error("Pool creation error:", error);
      
      if (error?.code === 'ACTION_REJECTED' || error?.code === 4001 || error?.message?.includes('user rejected')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the pool creation transaction.",
          status: "warning",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to create pool",
          status: "error",
          duration: 5000,
        });
      }
    } finally {
      setIsCreatingPool(false);
    }
  };

  const initJoinPool = async (): Promise<void> => {
    setIsJoiningPool(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Get network for existing pools
      const network = await provider.getNetwork();
      const networkName = getNetworkString(Number(network.chainId));
      setCurrentNetworkName(networkName);

      const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, signer);

      const { tokens: poolTokens } = await vaultContract.getPoolTokens(config.poolId);

      // For composable stable pools, we need to include the pool token itself
      const sortedTokenConfigs = config.tokens
        .filter(token => token.address && token.amount)
        .sort((a, b) => {
          const aIndex = poolTokens.findIndex(
            (addr: string) => ethers.getAddress(addr) === ethers.getAddress(a.address!),
          );
          const bIndex = poolTokens.findIndex(
            (addr: string) => ethers.getAddress(addr) === ethers.getAddress(b.address!),
          );
          return aIndex - bIndex;
        });

      const assets = sortedTokenConfigs.map(token => token.address!);

      // For composable stable pools, include the pool token
      if (config.type === "composableStable") {
        const poolTokenIndex = poolTokens.findIndex(
          (addr: string) => ethers.getAddress(addr) === ethers.getAddress(config.poolAddress!),
        );
        assets.splice(poolTokenIndex, 0, config.poolAddress!);
      }

      // Prepare amounts
      const amountsWithDecimals = await Promise.all(
        sortedTokenConfigs.map(async token => {
          const decimals = await checkDecimals(token.address!);
          return ethers.parseUnits(token.amount!, decimals);
        }),
      );

      // For composable stable pools, add the BPT amount
      if (config.type === "composableStable") {
        const poolTokenIndex = poolTokens.findIndex(
          (addr: string) => ethers.getAddress(addr) === ethers.getAddress(config.poolAddress!),
        );
        amountsWithDecimals.splice(
          poolTokenIndex,
          0,
          ethers.parseUnits("5192296858534827.628530496329", 18),
        );
      }

      const maxAmountsIn = amountsWithDecimals.map(amount => amount.toString());

      // Encode join data
      const JOIN_KIND_INIT = 0;
      const userData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256[]"],
        [JOIN_KIND_INIT, maxAmountsIn],
      );

      const joinRequest = {
        assets,
        maxAmountsIn,
        userData,
        fromInternalBalance: false,
      };

      console.log(userAddress);
      console.log(config.poolId);
      console.log(joinRequest);
      
      let tx;
      try {
        tx = await vaultContract.joinPool(
          config.poolId!,
          userAddress,
          userAddress,
          joinRequest,
        );
      } catch (error: any) {
        // User rejected transaction or other error during transaction creation
        console.error("Transaction rejected or failed:", error);
        
        if (error?.code === 'ACTION_REJECTED' || error?.code === 4001 || error?.message?.includes('user rejected')) {
          toast({
            title: "Transaction Cancelled",
            description: "You cancelled the transaction. Please approve the transaction to add liquidity.",
            status: "warning",
            duration: 5000,
          });
        } else {
          toast({
            title: "Transaction Failed",
            description: error?.message || "Failed to create transaction",
            status: "error",
            duration: 5000,
          });
        }
        setIsJoiningPool(false);
        return;
      }

      // Wait for transaction confirmation
      try {
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
          // Transaction failed on chain
          toast({
            title: "Transaction Failed",
            description: "The transaction failed on chain. Please try again.",
            status: "error",
            duration: 5000,
          });
          setIsJoiningPool(false);
          return;
        }
        
        // Transaction succeeded
        toast({
          title: "Success",
          description: "Successfully joined the pool!",
          status: "success",
          duration: 5000,
        });
        setIsApprovalModalOpen(false);
        setIsLiquidityAddedModalOpen(true);
      } catch (error: any) {
        console.error("Transaction confirmation error:", error);
        toast({
          title: "Transaction Error",
          description: "Error waiting for transaction confirmation. Check your wallet for status.",
          status: "error",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Unexpected error in join pool:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsJoiningPool(false);
    }
  };

  const createComposableStablePool = async (
    provider: ethers.BrowserProvider,
    networkName: NetworkString,
    config: PoolConfig,
  ) => {
    const signer = await provider.getSigner();
    const factoryAddress = FactoryAddressComposable[networkName];

    if (!factoryAddress) {
      throw new Error(`Network ${networkName} not supported`);
    }

    // Sort tokens by address
    const sortedTokens = [...config.tokens].sort((a, b) =>
      ethers.getAddress(a.address!) < ethers.getAddress(b.address!) ? -1 : 1,
    );

    // Get rate providers (default to zero address if not specified)
    const rateProviders = sortedTokens.map(token => token.rateProvider || ethers.ZeroAddress);

    // Create rate cache durations array
    const rateCacheDurations = sortedTokens.map(
      () => config.settings?.stableSpecific?.rateCacheDuration || "60",
    );

    const swapFeePercentage = ethers.parseUnits(
      (Number(config.settings?.swapFee) / 100).toString(),
      18,
    );

    // Generate random salt
    const salt = ethers.hexlify(ethers.randomBytes(32));

    const factory = new ethers.Contract(factoryAddress, CreateComposableABI, signer);

    console.log(sortedTokens.map(t => t.address));

    let tx;
    try {
      tx = await factory.create(
        config.settings?.name,
        config.settings?.symbol,
        sortedTokens.map(t => t.address),
        config.settings?.stableSpecific?.amplificationParameter || 100,
        rateProviders,
        rateCacheDurations,
        config.settings?.stableSpecific?.yieldFeeExempt || false,
        swapFeePercentage,
        config.settings?.stableSpecific?.feeManagement?.owner || (await signer.getAddress()),
        salt,
      );
    } catch (error: any) {
      // User rejected transaction or other error
      console.error("Transaction rejected or failed:", error);
      throw error; // Re-throw to be handled by handleCreatePool
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(receipt);
    console.log(receipt.logs);
    console.log(receipt.logs[0]);
    
    if (receipt.status === 0) {
      throw new Error("Transaction failed on chain");
    }
    
    const poolAddress = receipt.logs[0].address;

    // Get pool ID
    const poolContract = new ethers.Contract(poolAddress, composablePool, signer);

    const poolId = await poolContract.getPoolId();

    setConfig({
      ...config,
      poolId,
      poolAddress,
    });

    return poolId;
  };

  const createWeightedPool = async (
    provider: ethers.BrowserProvider,
    networkName: NetworkString,
    config: PoolConfig,
  ) => {
    const signer = await provider.getSigner();
    const factoryAddress = FactoryAddressWeighted[networkName];

    if (!factoryAddress) {
      throw new Error(`Network ${networkName} not supported`);
    }

    // Sort tokens by address
    const sortedTokens = [...config.tokens].sort((a, b) =>
      ethers.getAddress(a.address!) < ethers.getAddress(b.address!) ? -1 : 1,
    );

    // Parse weights to correct format
    const weights = sortedTokens.map(token =>
      ethers.parseUnits((Number(token.weight) / 100).toString(), 18),
    );

    // Generate random salt
    const salt = ethers.hexlify(ethers.randomBytes(32));

    // Get rate providers (default to zero address if not specified)
    const rateProviders = sortedTokens.map(token => token.rateProvider || ethers.ZeroAddress);

    const swapFeePercentage = ethers.parseUnits(
      (Number(config.settings?.swapFee) / 100).toString(),
      18,
    );

    const factory = new ethers.Contract(factoryAddress, CreateWeightedABI, signer);

    let tx;
    try {
      tx = await factory.create(
        config.settings?.name,
        config.settings?.symbol,
        sortedTokens.map(t => t.address),
        weights,
        rateProviders,
        swapFeePercentage,
        config.settings?.weightedSpecific?.feeManagement?.owner || (await signer.getAddress()),
        salt,
      );
    } catch (error: any) {
      // User rejected transaction or other error
      console.error("Transaction rejected or failed:", error);
      throw error; // Re-throw to be handled by handleCreatePool
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error("Transaction failed on chain");
    }

    const poolAddress = receipt.logs[0].address;

    // Get pool ID
    const poolContract = new ethers.Contract(poolAddress, weightedPool, signer);

    const poolId = await poolContract.getPoolId();
    setConfig({
      ...config,
      poolId,
      poolAddress,
    });

    return poolId;
  };

  const checkAllApprovals = async () => {
    setIsApprovalModalOpen(true);
    const newStates: ApprovalStates = {};

    for (const token of config.tokens) {
      if (!token.address || !token.amount) continue;

      newStates[token.address] = {
        checking: true,
        needsApproval: false,
        approved: false,
      };
      setApprovalStates(prev => ({ ...prev, ...newStates }));

      try {
        const decimals = await checkDecimals(token.address);
        const isApproved = await checkApproval(token.address, token.amount, decimals);

        newStates[token.address] = {
          checking: false,
          needsApproval: !isApproved,
          approved: isApproved,
          decimals,
        };
        setApprovalStates(prev => ({ ...prev, ...newStates }));
      } catch (error) {
        newStates[token.address] = {
          checking: false,
          needsApproval: true,
          approved: false,
          error: "Error checking approval",
        };
        setApprovalStates(prev => ({ ...prev, ...newStates }));
      }
    }
  };

  const renderFeeSettings = () => {
    const feeManagement = getFeeManagement();

    return (
      <>
        <FormControl>
          <FormLabel>Initial Swap Fee</FormLabel>
          <Stack spacing={4}>
            {!readOnly && (
              <ButtonGroup size="sm" isAttached variant="outline">
                {PRESET_FEES.map(fee => (
                  <Button
                    key={fee}
                    onClick={() => updateSettings("swapFee", fee)}
                    colorScheme={settings.swapFee === fee ? "blue" : "gray"}
                  >
                    {fee}%
                  </Button>
                ))}
              </ButtonGroup>
            )}
            <InputGroup>
              <NumberInput
                value={settings.swapFee}
                onChange={valueString => updateSettings("swapFee", parseFloat(valueString))}
                step={0.0001}
                min={0.0001}
                max={10}
                precision={4}
                isReadOnly={readOnly}
              >
                <NumberInputField />
                {!readOnly && (
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                )}
              </NumberInput>
              <InputRightAddon>%</InputRightAddon>
            </InputGroup>
          </Stack>
        </FormControl>

        <FormControl>
          <HStack>
            <FormLabel mb="0">Allow Balancer Governance to manage fees</FormLabel>
            <Tooltip
              label="Enable Balancer Governance to dynamically manage fees of this pool in order to maximize profits"
              hasArrow
            >
              <Icon as={InfoIcon} />
            </Tooltip>
          </HStack>
          <Switch
            isChecked={feeManagement?.type === "governance"}
            onChange={e => handleFeeManagementChange(e.target.checked ? "governance" : "fixed")}
            mt={2}
            isReadOnly={readOnly}
            isDisabled={readOnly}
          />
        </FormControl>

        {feeManagement?.type !== "governance" && (
          <FormControl>
            <FormLabel>Fee Management</FormLabel>
            <RadioGroup
              value={feeManagement?.type}
              onChange={value => handleFeeManagementChange(value as "fixed" | "custom")}
              isDisabled={readOnly}
            >
              <Stack>
                <Radio value="fixed">Permanently fix fees to the initial rate</Radio>
                <Radio value="custom">Allow dynamic fees from an address I choose</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        )}

        {feeManagement?.type === "custom" && (
          <FormControl>
            <FormLabel>Owner Address</FormLabel>
            <Input
              value={feeManagement.customOwner || ""}
              onChange={e => {
                if (readOnly) return;
                const value = e.target.value;
                setSettings(prev => {
                  const specific =
                    config.type === "weighted" ? "weightedSpecific" : "stableSpecific";
                  return {
                    ...prev,
                    [specific]: {
                      ...prev[specific]!,
                      feeManagement: {
                        ...prev[specific]!.feeManagement,
                        customOwner: value,
                        owner: value,
                      },
                    },
                  };
                });
              }}
              placeholder="0x..."
              isReadOnly={readOnly}
            />
          </FormControl>
        )}
      </>
    );
  };

  return (
    <>
      <InitJoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        poolId={config.poolId!}
        poolAddress={config.poolAddress!}
        isJoiningPool={isJoiningPool}
        onJoin={() => {
          setIsJoinModalOpen(false);
          checkAllApprovals();
        }}
      />
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        approvalStates={approvalStates}
        config={config}
        handleApprove={handleApprove}
        isJoiningPool={isJoiningPool}
        initJoinPool={initJoinPool}
      />
      <LiquidityAddedModal
        poolId={config.poolId!}
        poolAddress={config.poolAddress!}
        networkName={currentNetworkName}
        isOpen={isLiquidityAddedModalOpen}
        onClose={() => setIsLiquidityAddedModalOpen(false)}
      />
      <Stack spacing={6}>
        <VStack spacing={8} align="stretch">
          <Text fontSize="lg" fontWeight="bold">
            Pool Settings
          </Text>

          <FormControl>
            <FormLabel>Pool Name</FormLabel>
            <Input
              value={settings.name}
              onChange={e => updateSettings("name", e.target.value)}
              placeholder="My Balancer Pool"
              isReadOnly={readOnly}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Pool Symbol</FormLabel>
            <Input
              value={settings.symbol}
              onChange={e => updateSettings("symbol", e.target.value)}
              placeholder="BPT"
              isReadOnly={readOnly}
            />
          </FormControl>

          {renderFeeSettings()}

          {config.type === "composableStable" && settings.stableSpecific && (
            <>
              <FormControl>
                <FormLabel>
                  <Tooltip label="Amplification parameter controls the curvature of the invariant">
                    Amplification Parameter
                  </Tooltip>
                </FormLabel>
                <NumberInput
                  value={settings.stableSpecific.amplificationParameter}
                  onChange={valueString =>
                    updateStableSettings("amplificationParameter", parseInt(valueString))
                  }
                  min={1}
                  max={5000}
                  isReadOnly={readOnly}
                >
                  <NumberInputField />
                  {!readOnly && (
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  )}
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>
                  <Tooltip label="Duration (in seconds) that the oracle cache is considered valid">
                    Rate Cache Duration
                  </Tooltip>
                </FormLabel>
                <InputGroup>
                  <NumberInput
                    value={settings.stableSpecific.rateCacheDuration}
                    onChange={valueString => updateStableSettings("rateCacheDuration", valueString)}
                    min={1}
                    isReadOnly={readOnly}
                    width="full"
                  >
                    <NumberInputField />
                    {!readOnly && (
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    )}
                  </NumberInput>
                  <InputRightAddon>seconds</InputRightAddon>
                </InputGroup>
              </FormControl>

              <FormControl>
                <HStack>
                  <FormLabel mb="0">Yield Fee Exempt</FormLabel>
                  <Tooltip label="Exempt this pool from yield fees">
                    <Icon as={InfoIcon} />
                  </Tooltip>
                </HStack>
                <Switch
                  isChecked={settings.stableSpecific.yieldFeeExempt}
                  onChange={e => updateStableSettings("yieldFeeExempt", e.target.checked)}
                  mt={2}
                  isReadOnly={readOnly}
                  isDisabled={readOnly}
                />
              </FormControl>
            </>
          )}

          <HStack spacing={4} justify="flex-end">
            {!readOnly ? (
              <Button
                variant="secondary"
                onClick={handleCreatePool}
                isDisabled={isCreatingPool}
                isLoading={isCreatingPool}
              >
                Create Pool
              </Button>
            ) : (
              <Button variant="secondary" onClick={checkAllApprovals} isDisabled={isCreatingPool}>
                Initiate Join
              </Button>
            )}
          </HStack>
        </VStack>
      </Stack>
    </>
  );
};
