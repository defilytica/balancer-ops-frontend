"use client";
import React, { useState } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { AddIcon, CheckIcon } from "@chakra-ui/icons";
import { useComposer } from "./PayloadComposerContext";
import { generateUniqueOperationId } from "@/lib/utils/generateUniqueID";

interface ComposerButtonProps {
  generateData: () => {
    type: string;
    title?: string;
    description?: string;
    payload: any;
    params: Record<string, any>;
    builderPath?: string;
  } | null;
  isDisabled?: boolean;
  onAdd?: () => void;
}

const ComposerButton = ({ generateData, isDisabled = false, onAdd }: ComposerButtonProps) => {
  const { addOperation } = useComposer();
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const toast = useToast();

  const handleAddToComposer = async () => {
    try {
      setIsLoading(true);

      // Generate data when clicked
      const operationData = generateData();
      if (!operationData) {
        // generateData should have shown error toast
        return;
      }

      const operation = {
        id: generateUniqueOperationId(),
        type: operationData.type,
        title: operationData.title,
        description: operationData.description,
        payload: operationData.payload,
        params: operationData.params,
        builderPath: operationData.builderPath,
      };

      // Add to composer
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
