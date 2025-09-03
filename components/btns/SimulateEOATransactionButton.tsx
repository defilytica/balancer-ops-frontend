"use client";

import React, { useCallback, useState } from "react";
import { Button, Box, Text, Link, useToast, Flex, Badge } from "@chakra-ui/react";
import { ethers } from "ethers";
import { SimulationResult, SimulationTransaction } from "@/types/interfaces";

interface SimulateTransactionButtonProps {
  transactions: SimulationTransaction[];
  networkId: string;
  disabled?: boolean;
}

export default function SimulateTransactionButton({
  transactions,
  networkId,
  disabled = false,
}: SimulateTransactionButtonProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const toast = useToast();

  const simulateTransaction = useCallback(async (): Promise<void> => {
    if (!window.ethereum) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to simulate transactions",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null); // Reset the simulation result before starting a new simulation

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const from = await signer.getAddress();

      if (!transactions || transactions.length === 0) {
        throw new Error("No transactions provided for simulation");
      }

      // Always use bundle endpoint - it handles both single and multiple transactions
      const bundlePayload = {
        network_id: networkId,
        from,
        transactions,
      };

      const response = await fetch("/api/tenderly/simulate-eoa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bundlePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Even if the HTTP response indicates failure, we might still have simulation data
        if (result && result.url) {
          setSimulationResult(result);
        }
        throw new Error(result.message || "Simulation failed");
      }

      setSimulationResult(result);
      const isMultiple = transactions.length > 1;

      // Extract error message from failed simulation if available
      let description = `${isMultiple ? "Bundle" : "Transaction"} simulation ${result.success ? "succeeded" : "failed"}.`;
      if (!result.success && result.bundle?.simulation_results) {
        const failedSim = result.bundle.simulation_results.find(
          (sim: any) => sim.simulation?.error_message,
        );
        if (failedSim?.simulation?.error_message) {
          description = failedSim.simulation.error_message;
        }
      }

      toast({
        title: "Simulation Completed",
        description,
        status: result.success ? "success" : "warning",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Simulation error:", error);

      const isMultiple = transactions && transactions.length > 1;
      let errorMessage = `There was an error simulating the ${isMultiple ? "bundle" : "transaction"}.`;

      // Only clear simulation result if we don't already have one from a failed simulation
      if (!simulationResult) {
        setSimulationResult(null);
      }

      if (error instanceof Error) {
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
  }, [transactions, networkId, toast]);

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
          isDisabled={disabled || !transactions || transactions.length === 0}
        >
          Simulate{" "}
          {transactions && transactions.length > 1
            ? `${transactions.length} Transactions`
            : "Transaction"}
        </Button>
        {simulationResult && (
          <Box>
            <Flex align="center" mb={2}>
              <Text fontSize="sm" fontWeight="medium" mr={2}>
                Simulation Status:
              </Text>
              <Badge colorScheme={simulationResult.success ? "green" : "red"}>
                {simulationResult.success ? "Successful" : "Failed"}
              </Badge>
            </Flex>
            {simulationResult.url && (
              <Link
                href={simulationResult.url}
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
}
