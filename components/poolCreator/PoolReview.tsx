import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Stack,
    Text,
    Alert,
    AlertIcon,
    HStack,
    Spinner,
    useToast,
    VStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td
} from '@chakra-ui/react';
import {
    IoCheckmarkCircle,
    IoWarning
} from 'react-icons/io5';
import { ethers } from 'ethers';
import { PoolType } from "@/types/types";
import { PoolConfig, PoolToken } from "@/types/interfaces";
import { PoolSettingsComponent } from './PoolSettings';
import { ERC20 } from '@/abi/erc20';

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

type ApprovalStates = Record<string, TokenApprovalState>;

const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

export const PoolReview: React.FC<PoolReviewProps> = ({
                                                          config,
                                                          onBack
                                                      }) => {
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
    const [approvalStates, setApprovalStates] = useState<ApprovalStates>({});
    const [isCreatingPool, setIsCreatingPool] = useState<boolean>(false);
    const toast = useToast();

    // Check token decimals and store them
    const checkDecimals = async (tokenAddress: string): Promise<number> => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
        try {
            const decimals = await tokenContract.decimals();
            return decimals;
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
            return allowance.gte(requiredAmount);
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
        // Pool creation logic here
        setIsCreatingPool(true);
        try {
            // Add pool creation transaction
            toast({
                title: "Success",
                description: "Pool created successfully!",
                status: "success",
                duration: 5000,
            });
            setIsApprovalModalOpen(false);
        } catch (error) {
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
        </Box>
    );
};
