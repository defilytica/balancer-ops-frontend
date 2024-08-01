import React, { useState } from 'react';
import axios from 'axios';
import { Button, Box, Text, Link, useToast, VStack } from '@chakra-ui/react';

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

    const simulateTransaction = async (): Promise<void> => {
        setIsSimulating(true);
        try {
            const response = await axios.post<SimulationResult>('/api/tenderly/simulate-transaction', { batchFile });

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
    };

    const getTenderlyLink = (): string | null => {
        if (!simulationResult) return null;
        return simulationResult.url;
    };

    return (
        <VStack spacing={4} align="stretch">
            <Button
                onClick={simulateTransaction}
                isLoading={isSimulating}
                loadingText="Simulating..."
                colorScheme="blue"
            >
                Simulate Transaction Batch
            </Button>
            {simulationResult && (
                <Box>
                    <Text mb={2}>Simulation {simulationResult.success === '🟩 SUCCESS' ? 'successful' : 'failed'}!</Text>
                    <Link
                        href={getTenderlyLink() ?? '#'}
                        isExternal
                        color="blue.500"
                        fontWeight="medium"
                    >
                        View on Tenderly
                    </Link>
                </Box>
            )}
        </VStack>
    );
};

export default SimulateTransactionButton;
