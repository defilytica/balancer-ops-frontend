"use client";
import React, { useCallback, useState } from "react";
import axios, { AxiosError } from "axios";
import {
  Button,
  Box,
  Text,
  Link,
  useToast,
  Flex,
  Badge,
} from "@chakra-ui/react";

export interface Transaction {
  to: string;
  value: string;
  data: string | null;
  contractMethod?: {
    inputs: { internalType: string; name: string; type: string }[];
    name: string;
    payable: boolean;
  };
  contractInputsValues?: Record<string, any>;
}

export interface BatchFile {
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

export interface SimulationResult {
  url: string;
  success: string;
}

interface SimulateTransactionButtonProps {
  batchFile: BatchFile;
}

const SimulateTransactionButton: React.FC<SimulateTransactionButtonProps> = ({
  batchFile,
}) => {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const toast = useToast();

  const simulateTransaction = useCallback(async (): Promise<void> => {
    setIsSimulating(true);
    setSimulationResult(null); // Reset the simulation result before starting a new simulation
    try {
      // Create a deep copy of the batchFile
      const modifiedBatchFile = JSON.parse(JSON.stringify(batchFile));

      // Check if transactions exist and is an array
      if (Array.isArray(modifiedBatchFile.transactions)) {
        modifiedBatchFile.transactions = modifiedBatchFile.transactions.map(
          (tx: Transaction) => {
            if (tx.contractInputsValues && tx.contractMethod?.inputs) {
              tx.contractMethod.inputs.forEach((input) => {
                const inputName = input.name;
                let inputValue = tx.contractInputsValues![inputName];

                // Process array inputs
                if (
                  input.type.includes("[]") &&
                  typeof inputValue === "string"
                ) {
                  inputValue = inputValue
                    .replace(/^\[|\]$/g, "")
                    .split(",")
                    .map((x) => x.trim());
                }

                // Process based on input type
                if (input.type.includes("bool")) {
                  tx.contractInputsValues![inputName] = Array.isArray(
                    inputValue,
                  )
                    ? inputValue.map((x) => x.toLowerCase() === "true")
                    : inputValue.toLowerCase() === "true";
                } else if (input.type.includes("int")) {
                  tx.contractInputsValues![inputName] = Array.isArray(
                    inputValue,
                  )
                    ? inputValue.map((x) => BigInt(x).toString())
                    : BigInt(inputValue).toString();
                } else if (input.type.includes("address")) {
                  // Ensure addresses start with '0x'
                  tx.contractInputsValues![inputName] = Array.isArray(
                    inputValue,
                  )
                    ? inputValue.map((x) => (x.startsWith("0x") ? x : `0x${x}`))
                    : inputValue.startsWith("0x")
                      ? inputValue
                      : `0x${inputValue}`;
                } else {
                  // Catchall: cast to string
                  tx.contractInputsValues![inputName] = Array.isArray(
                    inputValue,
                  )
                    ? inputValue.map((x) => x.toString())
                    : inputValue.toString();
                }
              });
            }
            return tx;
          },
        );
      } else {
        throw new Error(
          "Invalid batch file structure: transactions is not an array",
        );
      }

      const response = await axios.post<SimulationResult>(
        "/api/tenderly/simulate-transactions",
        modifiedBatchFile,
      );

      setSimulationResult(response.data);
      toast({
        title: "Simulation Completed",
        description: `Transaction simulation ${response.data.success === "🟩 SUCCESS" ? "succeeded" : "failed"}.`,
        status: response.data.success === "🟩 SUCCESS" ? "success" : "warning",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Simulation failed:", error);
      setSimulationResult(null); // Ensure simulationResult is null on error
      let errorMessage = "There was an error simulating the transaction.";
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: string }>;
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Simulation Failed",
        description: errorMessage,
        status: "error",
        duration: 10000,
        isClosable: true,
      });
    } finally {
      setIsSimulating(false);
    }
  }, [batchFile, toast]);

  const getTenderlyLink = (): string | null => {
    return simulationResult?.url ?? null;
  };

  return (
    <Box borderRadius="lg" p={2} maxWidth="300px">
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
              <Badge
                colorScheme={
                  simulationResult.success === "🟩 SUCCESS" ? "green" : "red"
                }
              >
                {simulationResult.success === "🟩 SUCCESS"
                  ? "Successful"
                  : "Failed"}
              </Badge>
            </Flex>
            {getTenderlyLink() && (
              <Link
                href={getTenderlyLink() ?? "#"}
                isExternal
                color="blue.500"
                fontWeight="medium"
                fontSize="sm"
              >
                View Details on Tenderly
              </Link>
            )}
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default SimulateTransactionButton;
