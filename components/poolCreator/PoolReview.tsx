import React, {useState} from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button, FormControl, FormLabel,
    HStack, Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Table,
    Text,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useToast,
    VStack
} from '@chakra-ui/react';
import {IoCheckmarkCircle, IoWarning} from 'react-icons/io5';
import {ethers} from 'ethers';
import {PoolConfig} from "@/types/interfaces";
import {PoolSettingsComponent} from './PoolSettings';
import {ERC20} from '@/abi/erc20';
import {CreateWeightedABI} from "@/abi/WeightedPoolFactory";
import {FactoryAddressComposable, FactoryAddressWeighted} from "@/constants/constants";
import {weightedPool} from "@/abi/WeightedPool";
import {getNetworkString} from "@/lib/utils/getNetworkString";
import {vaultABI} from "@/abi/BalVault";
import {CreateComposableABI} from "@/abi/ComposableStableFactory";
import {composablePool} from "@/abi/ComposablePool";

interface PoolReviewProps {
    config: PoolConfig;
    onBack: () => void;
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


const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

export const PoolReview: React.FC<PoolReviewProps> = ({
                                                          config,
                                                          onBack
                                                      }) => {
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
    const [approvalStates, setApprovalStates] = useState<ApprovalStates>({});
    const [isCreatingPool, setIsCreatingPool] = useState<boolean>(false);
    const [isJoiningPool, setIsJoiningPool] = useState<boolean>(false);
    const [poolId, setPoolId] = useState<string>("");
    const [poolAddress, setPoolAddress] = useState<string>("");
    const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
    const [lookupPoolAddress, setLookupPoolAddress] = useState<string>("");
    const toast = useToast();

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

    // Handle token approval
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

    // Check all token approvals
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

    const handleCreatePool = async (): Promise<void> => {
        setIsCreatingPool(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const networkName = getNetworkString(Number(network.chainId));

            const newPoolId = config.type === 'weighted'
                ? await createWeightedPool(provider, networkName, config)
                : await createComposableStablePool(provider, networkName, config);

            setPoolId(newPoolId);

            toast({
                title: "Success",
                description: `Pool created successfully! Pool ID: ${newPoolId}`,
                status: "success",
                duration: 5000,
            });
            setIsApprovalModalOpen(false);
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
        }
    };

    const allTokensApproved = Object.values(approvalStates).every(
        state => state.approved && !state.checking
    );

    const createWeightedPool = async (
        provider: ethers.BrowserProvider,
        networkName: NetworkString,
        config: PoolConfig
    ): Promise<string> => {
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

        return await poolContract.getPoolId();
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
                assets.push(poolAddress);
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
                amountsWithDecimals.push(ethers.parseUnits("5192296858534827.628530496329", 18));
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

            const tx = await vaultContract.joinPool(
                poolId,
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
    ): Promise<string> => {
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
        const poolAddress = receipt.logs[0].address;
        setPoolAddress(poolAddress); // Store pool address for join operation

        // Get pool ID
        const poolContract = new ethers.Contract(
            poolAddress,
            composablePool,
            signer
        );

        return await poolContract.getPoolId();
    };

    const checkPoolOwnership = async (): Promise<boolean> => {
        if (!poolAddress) return false;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            const poolContract = new ethers.Contract(
                poolAddress,
                weightedPool,
                provider
            );

            const owner = await poolContract.getOwner();
            return owner.toLowerCase() === userAddress.toLowerCase();
        } catch (error) {
            console.error('Error checking pool ownership:', error);
            return false;
        }
    };

    const retrievePoolId = async (poolAddress: string): Promise<string> => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const poolContract = new ethers.Contract(
            poolAddress,
            weightedPool,
            provider
        );
        return await poolContract.getPoolId();
    };

    return (
        <Box>
            <VStack spacing={8} align="stretch">
                <PoolSettingsComponent
                    poolType={config.type}
                    initialSettings={config.settings}
                    onSettingsUpdate={() => {}}
                    readOnly={true}
                />

                <HStack spacing={4} justify="flex-end">
                    <Button
                        variant="secondary"
                        onClick={checkAllApprovals}
                        isDisabled={isCreatingPool}
                    >
                        Create Pool
                    </Button>
                </HStack>
            </VStack>

            <Modal
                isOpen={isJoinModalOpen}
                onClose={() => !isJoiningPool && setIsJoinModalOpen(false)}
                closeOnOverlayClick={false}
                size="xl"
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Join Pool</ModalHeader>
                    <ModalBody>
                        <VStack spacing={6} align="stretch">
                            {[
                                <Alert key="alert" status="info" borderRadius="md">
                                    <AlertIcon />
                                    Pool has been created successfully!
                                </Alert>,
                                <Box key="pool-info" borderWidth="1px" borderRadius="lg" p={4} >
                                    <VStack align="stretch" spacing={3}>
                                        <Box>
                                            <Text fontWeight="semibold"  fontSize="sm">
                                                Pool ID
                                            </Text>
                                            <Text fontSize="md" fontFamily="mono" mt={1} wordBreak="break-all">
                                                {poolId}
                                            </Text>
                                        </Box>
                                        <Box>
                                            <Text fontWeight="semibold"  fontSize="sm">
                                                Pool Address
                                            </Text>
                                            <Text fontSize="md" fontFamily="mono" mt={1} wordBreak="break-all">
                                                {poolAddress}
                                            </Text>
                                        </Box>
                                        <Alert status="warning" size="sm" mt={2}>
                                            <AlertIcon />
                                            Save these details for future reference
                                        </Alert>
                                    </VStack>
                                </Box>
                            ]}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="ghost"
                            mr={3}
                            onClick={() => setIsJoinModalOpen(false)}
                            isDisabled={isJoiningPool}
                        >
                            Later
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={initJoinPool}
                            isLoading={isJoiningPool}
                            loadingText="Joining Pool"
                        >
                            Join Now
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isApprovalModalOpen}
                onClose={() => !isCreatingPool && setIsApprovalModalOpen(false)}
                closeOnOverlayClick={false}
                size="xl"
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Token Approvals Required</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th>Token</Th>
                                        <Th>Amount</Th>
                                        <Th>Status</Th>
                                        <Th>Action</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {config.tokens.map((token, index) => {
                                        if (!token.address || !token.amount) return null;
                                        const state = approvalStates[token.address];

                                        return (
                                            <Tr key={token.address}>
                                                <Td>{token.symbol || 'Unknown'}</Td>
                                                <Td>{token.amount}</Td>
                                                <Td>
                                                    {state?.checking ? (
                                                        <Spinner size="sm" />
                                                    ) : state?.approved ? (
                                                        <IoCheckmarkCircle color="green" />
                                                    ) : (
                                                        <IoWarning color="orange" />
                                                    )}
                                                </Td>
                                                <Td>
                                                    <Button
                                                        size="sm"
                                                        colorScheme={state?.approved ? 'green' : 'blue'}
                                                        isDisabled={state?.approved || state?.checking}
                                                        onClick={() => handleApprove(token.address!)}
                                                    >
                                                        {state?.approved ? 'Approved' : 'Approve'}
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>

                            {allTokensApproved && (
                                <Alert status="success">
                                    <AlertIcon />
                                    All tokens approved! Ready to create pool.
                                </Alert>
                            )}
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            variant="ghost"
                            mr={3}
                            onClick={() => setIsApprovalModalOpen(false)}
                            isDisabled={isCreatingPool}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleCreatePool}
                            isDisabled={!allTokensApproved || isCreatingPool}
                            isLoading={isCreatingPool}
                            loadingText="Creating Pool"
                        >
                            Create Pool
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Box mt={4}>
                <FormControl>
                    <FormLabel>Look up existing pool</FormLabel>
                    <Input
                        placeholder="Enter pool address"
                        value={lookupPoolAddress}
                        onChange={(e) => setLookupPoolAddress(e.target.value)}
                    />
                    <Button
                        mt={2}
                        onClick={async () => {
                            if (lookupPoolAddress) {
                                const id = await retrievePoolId(lookupPoolAddress);
                                setPoolId(id);
                                setPoolAddress(lookupPoolAddress);
                                setIsJoinModalOpen(true);
                            }
                        }}
                    >
                        Look Up Pool
                    </Button>
                </FormControl>
            </Box>
        </Box>
    );
};
