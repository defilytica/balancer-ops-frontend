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
} from '@chakra-ui/react'
import { useState, useCallback, useEffect } from 'react'
import { CreateComposableABI } from "@/abi/ComposableStableFactory";
import { CreateWeightedABI } from "@/abi/WeightedPoolFactory";
import { vaultABI } from "@/abi/BalVault";
import { composablePool } from "@/abi/ComposablePool";
import { weightedPool } from "@/abi/WeightedPool";
import { FactoryAddressComposable, FactoryAddressWeighted, GOVERNANCE_ADDRESS, PRESET_FEES, VAULT_ADDRESS } from "@/constants/constants";
import { InfoIcon } from "@chakra-ui/icons";
import { PoolSettings, StablePoolSpecific, WeightedPoolSpecific } from "@/types/interfaces";
import { PoolConfig } from '@/types/interfaces';
import { getNetworkString } from '@/lib/utils/getNetworkString';
import { ethers } from 'ethers';
import { ERC20 } from '@/abi/erc20';
import { InitJoinModal } from './InitJoinModal';
import { ApprovalModal } from './ApprovalModal';
import { LiquidityAddedModal } from './LiquidityAddedModal';


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
    const [settings, setSettings] = useState<PoolSettings>(() => ({
        swapFee: 0.1,
        name: '',
        symbol: '',
        ...(config.type === 'weighted' ? {
            weightedSpecific: {
                feeManagement: {
                    type: 'governance',
                    owner: GOVERNANCE_ADDRESS
                }
            }
        } : {
            stableSpecific: {
                amplificationParameter: 100,
                metaStableEnabled: false,
                rateCacheDuration: '60', // Default 1 minute
                yieldFeeExempt: false,
                feeManagement: {
                    type: 'governance',
                    owner: GOVERNANCE_ADDRESS
                }
            }
        }),
        ...config.settings
    }));
    const toast = useToast();

    console.log(config)

    useEffect(() => {
        if (!readOnly) {
            onSettingsUpdate(settings);
        }
    }, [onSettingsUpdate, settings, readOnly]);

    const getFeeManagement = () => {
        if (config.type === 'weighted') {
            return settings.weightedSpecific?.feeManagement;
        }
        return settings.stableSpecific?.feeManagement;
    };

    const updateSettings = useCallback((field: string, value: any) => {
        if (readOnly) return;

        setSettings(prev => {
            const newSettings = { ...prev, [field]: value };
            return newSettings;
        });
    }, [readOnly]);

    const handleFeeManagementChange = useCallback((type: 'fixed' | 'governance' | 'custom') => {
        if (readOnly) return;

        setSettings(prev => {
            const feeManagement = {
                type,
                customOwner: type === 'custom' ? '' : undefined,
                owner: type === 'governance' ? GOVERNANCE_ADDRESS : undefined,
            };

            if (config.type === 'weighted' && prev.weightedSpecific) {
                return {
                    ...prev,
                    weightedSpecific: {
                        ...prev.weightedSpecific,
                        feeManagement
                    }
                };
            } else if (prev.stableSpecific) {
                return {
                    ...prev,
                    stableSpecific: {
                        ...prev.stableSpecific,
                        feeManagement
                    }
                };
            }
            return prev;
        });
    }, [readOnly]);

    const updateStableSettings = useCallback((field: keyof StablePoolSpecific, value: any) => {
        if (readOnly) return;

        setSettings(prev => {
            if (!prev.stableSpecific) return prev;
            return {
                ...prev,
                stableSpecific: {
                    ...prev.stableSpecific,
                    [field]: value
                }
            };
        });
    }, [readOnly]);


    // Check token decimals and store them
    const checkDecimals = async (tokenAddress: string): Promise<number> => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
        try {
            return await tokenContract.decimals();
        } catch (error) {
            console.error('Error getting decimals:', error);
            return 18; // Default to 18 if there's an error
        }
    };

    const handleApprove = async (tokenAddress: string): Promise<void> => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);

        try {
            const tx = await tokenContract.approve(
                VAULT_ADDRESS,
                ethers.MaxUint256
            );

            setApprovalStates(prev => ({
                ...prev,
                [tokenAddress]: {
                    ...prev[tokenAddress],
                    checking: true,
                    error: undefined
                }
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
                        needsApproval: !isApproved
                    }
                }));
            }
        } catch (error) {
            setApprovalStates(prev => ({
                ...prev,
                [tokenAddress]: {
                    ...prev[tokenAddress],
                    checking: false,
                    error: 'Failed to approve token'
                }
            }));

            toast({
                title: 'Error',
                description: 'Failed to approve token',
                status: 'error',
                duration: 5000,
            });
        }
    };

    // Check if token amount is approved
    const checkApproval = async (
        tokenAddress: string,
        amount: string,
        decimals: number
    ): Promise<boolean> => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
        const requiredAmount = ethers.parseUnits(amount || '0', decimals);

        try {
            const allowance = await tokenContract.allowance(userAddress, VAULT_ADDRESS);
            return Number(allowance) >= requiredAmount
        } catch (error) {
            console.error('Error checking allowance:', error);
            return false;
        }
    };

    const handleCreatePool = async (): Promise<void> => {
        setIsCreatingPool(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const networkName = getNetworkString(Number(network.chainId));

            const newPoolId = config.type === 'weighted'
                ? await createWeightedPool(provider, networkName, config)
                : await createComposableStablePool(provider, networkName, config);

            toast({
                title: "Success",
                description: `Pool created successfully! Pool ID: ${newPoolId}`,
                status: "success",
                duration: 5000,
            });

            setIsJoinModalOpen(true);
        } catch (error) {
            console.error('Pool creation error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to create pool',
                status: "error",
                duration: 5000,
            });
        } finally {
            setIsCreatingPool(false);
            setIsJoinModalOpen(true);
        }
    };

    const initJoinPool = async (): Promise<void> => {
        setIsJoiningPool(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            const vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultABI, signer);

            // For composable stable pools, we need to include the pool token itself
            const assets = [...config.tokens]
                .filter(token => token.address && token.amount)
                .sort((a, b) =>
                    ethers.getAddress(a.address!) < ethers.getAddress(b.address!) ? -1 : 1
                )
                .map(token => token.address!);

            if (config.type === 'composableStable') {
                assets.splice(1, 0, config.poolAddress!);
            }

            // Prepare amounts
            const amountsWithDecimals = await Promise.all(
                config.tokens
                    .filter(token => token.address && token.amount)
                    .sort((a, b) =>
                        ethers.getAddress(a.address!) < ethers.getAddress(b.address!) ? -1 : 1
                    )
                    .map(async token => {
                        const decimals = await checkDecimals(token.address!);
                        return ethers.parseUnits(token.amount!, decimals);
                    })
            );

            // For composable stable pools, add the BPT amount
            if (config.type === 'composableStable') {
                amountsWithDecimals.splice(1, 0, ethers.parseUnits("5192296858534827.628530496329", 18));
            }

            const maxAmountsIn = amountsWithDecimals.map(amount => amount.toString());

            // Encode join data
            const JOIN_KIND_INIT = 0;
            const userData = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256[]"],
                [JOIN_KIND_INIT, maxAmountsIn]
            );

            const joinRequest = {
                assets,
                maxAmountsIn,
                userData,
                fromInternalBalance: false
            };

            console.log(userAddress)
            console.log(config.poolId)
            console.log(joinRequest)
            const tx = await vaultContract.joinPool(
                config.poolId!,
                userAddress,
                userAddress,
                joinRequest
            );

            await tx.wait();

            toast({
                title: "Success",
                description: "Successfully joined the pool!",
                status: "success",
                duration: 5000,
            });
            setIsApprovalModalOpen(false);
            setIsLiquidityAddedModalOpen(true);
        } catch (error) {
            console.error('Join pool error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to join pool',
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
        config: PoolConfig
    ) => {
        const signer = await provider.getSigner();
        const factoryAddress = FactoryAddressComposable[networkName];

        if (!factoryAddress) {
            throw new Error(`Network ${networkName} not supported`);
        }

        // Sort tokens by address
        const sortedTokens = [...config.tokens].sort((a, b) =>
            ethers.getAddress(a.address!) < ethers.getAddress(b.address!) ? -1 : 1
        );

        // Get rate providers (default to zero address if not specified)
        const rateProviders = sortedTokens.map(token =>
            token.rateProvider || ethers.ZeroAddress
        );

        // Create rate cache durations array
        const rateCacheDurations = sortedTokens.map(() =>
            config.settings?.stableSpecific?.rateCacheDuration || '60'
        );

        const swapFeePercentage = ethers.parseUnits(
            (Number(config.settings?.swapFee) / 100).toString(),
            18
        );

        // Generate random salt
        const salt = ethers.hexlify(ethers.randomBytes(32));

        const factory = new ethers.Contract(
            factoryAddress,
            CreateComposableABI,
            signer
        );

        const tx = await factory.create(
            config.settings?.name,
            config.settings?.symbol,
            sortedTokens.map(t => t.address),
            config.settings?.stableSpecific?.amplificationParameter || 100,
            rateProviders,
            rateCacheDurations,
            config.settings?.stableSpecific?.yieldFeeExempt || false,
            swapFeePercentage,
            config.settings?.stableSpecific?.feeManagement?.owner || await signer.getAddress(),
            salt
        );

        const receipt = await tx.wait();
        console.log(receipt)
        console.log(receipt.logs)
        console.log(receipt.logs[0])
        const poolAddress = receipt.logs[0].address;
        
        // Get pool ID
        const poolContract = new ethers.Contract(
            poolAddress,
            composablePool,
            signer
        );

        const poolId = await poolContract.getPoolId();

        setConfig({
            ...config,
            poolId,
            poolAddress
        });

        return poolId;
    };

    const createWeightedPool = async (
        provider: ethers.BrowserProvider,
        networkName: NetworkString,
        config: PoolConfig
    )  => {
        const signer = await provider.getSigner();
        const factoryAddress = FactoryAddressWeighted[networkName];

        if (!factoryAddress) {
            throw new Error(`Network ${networkName} not supported`);
        }

        // Sort tokens by address
        const sortedTokens = [...config.tokens].sort((a, b) =>
            ethers.getAddress(a.address!) < ethers.getAddress(b.address!) ? -1 : 1
        );

        // Parse weights to correct format
        const weights = sortedTokens.map(token =>
            ethers.parseUnits((Number(token.weight) / 100).toString(), 18)
        );

        // Generate random salt
        const salt = ethers.hexlify(ethers.randomBytes(32));

        // Get rate providers (default to zero address if not specified)
        const rateProviders = sortedTokens.map(token =>
            token.rateProvider || ethers.ZeroAddress
        );

        const swapFeePercentage = ethers.parseUnits(
            (Number(config.settings?.swapFee) / 100).toString(),
            18
        );

        const factory = new ethers.Contract(
            factoryAddress,
            CreateWeightedABI,
            signer
        );

        const tx = await factory.create(
            config.settings?.name,
            config.settings?.symbol,
            sortedTokens.map(t => t.address),
            weights,
            rateProviders,
            swapFeePercentage,
            config.settings?.weightedSpecific?.feeManagement?.owner || await signer.getAddress(),
            salt
        );

        const receipt = await tx.wait();
        const poolAddress = receipt.logs[0].address;
 
        // Get pool ID
        const poolContract = new ethers.Contract(
            poolAddress,
            weightedPool,
            signer
        );

        const poolId = await poolContract.getPoolId();
        setConfig({
            ...config,
            poolId,
            poolAddress
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
                approved: false
            };
            setApprovalStates(prev => ({ ...prev, ...newStates }));

            try {
                const decimals = await checkDecimals(token.address);
                const isApproved = await checkApproval(token.address, token.amount, decimals);

                newStates[token.address] = {
                    checking: false,
                    needsApproval: !isApproved,
                    approved: isApproved,
                    decimals
                };
                setApprovalStates(prev => ({ ...prev, ...newStates }));
            } catch (error) {
                newStates[token.address] = {
                    checking: false,
                    needsApproval: true,
                    approved: false,
                    error: 'Error checking approval'
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
                                        onClick={() => updateSettings('swapFee', fee)}
                                        colorScheme={settings.swapFee === fee ? 'blue' : 'gray'}
                                    >
                                        {fee}%
                                    </Button>
                                ))}
                            </ButtonGroup>
                        )}
                        <InputGroup>
                            <NumberInput
                                value={settings.swapFee}
                                onChange={(valueString) => updateSettings('swapFee', parseFloat(valueString))}
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
                        isChecked={feeManagement?.type === 'governance'}
                        onChange={(e) => handleFeeManagementChange(e.target.checked ? 'governance' : 'fixed')}
                        mt={2}
                        isReadOnly={readOnly}
                        isDisabled={readOnly}
                    />
                </FormControl>

                {feeManagement?.type !== 'governance' && (
                    <FormControl>
                        <FormLabel>Fee Management</FormLabel>
                        <RadioGroup
                            value={feeManagement?.type}
                            onChange={(value) => handleFeeManagementChange(value as 'fixed' | 'custom')}
                            isDisabled={readOnly}
                        >
                            <Stack>
                                <Radio value="fixed">Permanently fix fees to the initial rate</Radio>
                                <Radio value="custom">Allow dynamic fees from an address I choose</Radio>
                            </Stack>
                        </RadioGroup>
                    </FormControl>
                )}

                {feeManagement?.type === 'custom' && (
                    <FormControl>
                        <FormLabel>Owner Address</FormLabel>
                        <Input
                            value={feeManagement.customOwner || ''}
                            onChange={(e) => {
                                if (readOnly) return;
                                const value = e.target.value;
                                setSettings(prev => {
                                    const specific = config.type === 'weighted' ? 'weightedSpecific' : 'stableSpecific';
                                    return {
                                        ...prev,
                                        [specific]: {
                                            ...prev[specific]!,
                                            feeManagement: {
                                                ...prev[specific]!.feeManagement,
                                                customOwner: value,
                                                owner: value
                                            }
                                        }
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
                onJoin={() => { setIsApprovalModalOpen(true); setIsJoinModalOpen(false) }}
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
                isOpen={isLiquidityAddedModalOpen}
                onClose={() => setIsLiquidityAddedModalOpen(false)}
            />
            <Stack spacing={6}>
                <VStack spacing={8} align="stretch">
                    <Text fontSize="lg" fontWeight="bold">Pool Settings</Text>

                    <FormControl>
                        <FormLabel>Pool Name</FormLabel>
                        <Input
                            value={settings.name}
                            onChange={(e) => updateSettings('name', e.target.value)}
                            placeholder="My Balancer Pool"
                            isReadOnly={readOnly}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Pool Symbol</FormLabel>
                        <Input
                            value={settings.symbol}
                            onChange={(e) => updateSettings('symbol', e.target.value)}
                            placeholder="BPT"
                            isReadOnly={readOnly}
                        />
                    </FormControl>

                    {renderFeeSettings()}

                    {config.type === 'composableStable' && settings.stableSpecific && (
                        <>
                            <FormControl>
                                <FormLabel>
                                    <Tooltip label="Amplification parameter controls the curvature of the invariant">
                                        Amplification Parameter
                                    </Tooltip>
                                </FormLabel>
                                <NumberInput
                                    value={settings.stableSpecific.amplificationParameter}
                                    onChange={(valueString) =>
                                        updateStableSettings('amplificationParameter', parseInt(valueString))
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
                                        onChange={(valueString) =>
                                            updateStableSettings('rateCacheDuration', valueString)
                                        }
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
                                    <FormLabel mb="0">
                                        Enable Meta-Stable
                                    </FormLabel>
                                    <Tooltip label="Enable meta-stable features for rate providers">
                                        <Icon as={InfoIcon} />
                                    </Tooltip>
                                </HStack>
                                <Switch
                                    isChecked={settings.stableSpecific.metaStableEnabled}
                                    onChange={(e) => updateStableSettings('metaStableEnabled', e.target.checked)}
                                    mt={2}
                                    isReadOnly={readOnly}
                                    isDisabled={readOnly}
                                />
                            </FormControl>

                            <FormControl>
                                <HStack>
                                    <FormLabel mb="0">
                                        Yield Fee Exempt
                                    </FormLabel>
                                    <Tooltip label="Exempt this pool from yield fees">
                                        <Icon as={InfoIcon} />
                                    </Tooltip>
                                </HStack>
                                <Switch
                                    isChecked={settings.stableSpecific.yieldFeeExempt}
                                    onChange={(e) => updateStableSettings('yieldFeeExempt', e.target.checked)}
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
                        ) : <Button
                            variant="secondary"
                            onClick={checkAllApprovals}
                            isDisabled={isCreatingPool}
                        >
                            Initiate Join
                        </Button>}
                    </HStack>
                </VStack>
            </Stack>
        </>
    );
};
