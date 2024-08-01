'use client'
import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import {Button, Box, Text, Link, useToast, VStack, Flex, Badge} from '@chakra-ui/react';

interface Transaction {
    to: string;
    value: string;
    data: string | null;
    operation?: number;
    contractMethod?: {
        inputs: { internalType: string; name: string; type: string }[];
        name: string;
        payable: boolean;
    };
    contractInputsValues?: Record<string, string>;
}

interface BatchFile {
    version: string;
    chainId: string;
    createdAt: number;
    meta: {
        name: string;
        description: string;
        txBuilderVersion: string;
        createdFromSafeAddress: string;
        createdFromOwnerAddress: string;
        checksum: string;
    };
    transactions: Transaction[];
}

interface SimulationResult {
    url: string;
    success: string;
}

interface SimulateTransactionButtonProps {
    batchFile: BatchFile;
}

const SimulateTransactionButton: React.FC<SimulateTransactionButtonProps> = ({ batchFile }) => {
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const toast = useToast();

    const simulateTransaction = useCallback(async (): Promise<void> => {
        setIsSimulating(true);
        try {
            const response = await axios.post<SimulationResult>('/api/tenderly/simulate-transactions', batchFile);

            setSimulationResult(response.data);
            toast({
                title: "Simulation Completed",
                description: `Transaction simulation ${response.data.success === '🟩 SUCCESS' ? 'succeeded' : 'failed'}.`,
                status: response.data.success === '🟩 SUCCESS' ? "success" : "warning",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Simulation failed:', error);
            toast({
                title: "Simulation Failed",
                description: "There was an error simulating the transaction.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSimulating(false);
        }
    }, [batchFile, toast]);

    useEffect(() => {
        return () => {
            // Cleanup function to prevent state updates on unmounted component
        };
    }, []);

    const getTenderlyLink = (): string | null => {
        if (!simulationResult) return null;
        return simulationResult.url;
    };

    return (
        <Box  borderRadius="lg" p={2} maxWidth="300px">
            <Flex direction="column" align="stretch">
                <Button
                    onClick={simulateTransaction}
                    variant="secondary"
                    isLoading={isSimulating}
                    loadingText="Simulating..."
                    colorScheme="blue"
                    size="sm"
                    mb={3}
                >
                    Simulate Transaction Batch
                </Button>
                {simulationResult && (
                    <Box>
                        <Flex align="center" mb={2}>
                            <Text fontSize="sm" fontWeight="medium" mr={2}>
                                Simulation Status:
                            </Text>
                            <Badge colorScheme={simulationResult.success === '🟩 SUCCESS' ? 'green' : 'red'}>
                                {simulationResult.success === '🟩 SUCCESS' ? 'Successful' : 'Failed'}
                            </Badge>
                        </Flex>
                        <Link
                            href={getTenderlyLink() ?? '#'}
                            isExternal
                            color="blue.500"
                            fontWeight="medium"
                            fontSize="sm"
                        >
                            View Details on Tenderly
                        </Link>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};

export default SimulateTransactionButton;
