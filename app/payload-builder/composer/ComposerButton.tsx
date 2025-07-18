"use client";
import React, { useState } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { AddIcon, CheckIcon } from "@chakra-ui/icons";
import { useComposer, type PayloadOperation } from "./PayloadComposerContext";
import { generateUniqueOperationId } from "@/lib/utils/generateUniqueID";
import type { SafeBatchFile, SafeTransaction } from "./payloadCombiner";

interface ComposerButtonProps {
  generateData: () => {
    type: string;
    title?: string;
    description?: string;
    payload: SafeBatchFile;
    params: Record<string, any>;
    builderPath?: string;
  } | null;
  isDisabled?: boolean;
  onAdd?: () => void;
}

const ComposerButton = ({ generateData, isDisabled = false, onAdd }: ComposerButtonProps) => {
  const { addOperation, operations } = useComposer();
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const toast = useToast();

  // Simple duplicate detection function
  const findDuplicate = (newTransactions: SafeTransaction[]) => {
    for (const existing of operations) {
      const existingTransactions = existing.payload?.transactions || [];
      if (JSON.stringify(newTransactions) === JSON.stringify(existingTransactions)) {
        return existing;
      }
    }
    return null;
  };

  const addOperationToComposer = (operationData: Omit<PayloadOperation, "timestamp" | "id">) => {
    const operation = {
      id: generateUniqueOperationId(),
      type: operationData.type,
      title: operationData.title,
      description: operationData.description,
      payload: operationData.payload,
      params: operationData.params,
      builderPath: operationData.builderPath,
    };

    addOperation(operation);

    // Show success feedback
    setJustAdded(true);
    toast({
      title: "Added to Composer",
      description: `"${operationData.title}" has been added to your payload composer`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    // Call optional callback
    onAdd?.();

    // Reset success state after animation
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleAddToComposer = async () => {
    try {
      setIsLoading(true);

      // Generate data when clicked
      const operationData = generateData();
      if (!operationData) {
        return;
      }

      const newTransactions = operationData.payload?.transactions || [];

      // Check if transactions array is empty
      if (newTransactions.length === 0) {
        toast({
          title: "No Transactions",
          description: "Cannot add to Composer: No transactions in payload.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const duplicate = findDuplicate(newTransactions);

      // If duplicate found, show toast and don't add
      if (duplicate) {
        toast({
          title: "Duplicate Transaction",
          description: "This transaction is already in your Composer.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      // No duplicate, add the operation
      addOperationToComposer(operationData);
    } catch (error) {
      console.error("Failed to add operation to composer:", error);
      toast({
        title: "Failed to Add",
        description: error instanceof Error ? error.message : "Could not add operation to composer",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToComposer}
      isDisabled={isDisabled}
      isLoading={isLoading}
      loadingText="Adding..."
      colorScheme={justAdded ? "green" : "brown"}
      variant="outline"
      leftIcon={justAdded ? <CheckIcon /> : <AddIcon />}
      size="md"
      minW="120px"
    >
      {justAdded ? "Added!" : "Add to Composer"}
    </Button>
  );
};

export default ComposerButton;
