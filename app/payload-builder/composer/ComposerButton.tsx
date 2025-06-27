"use client";
import React, { useState } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { AddIcon, CheckIcon } from "@chakra-ui/icons";
import { useComposer } from "./PayloadComposerContext";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";

interface ComposerButtonProps {
  type: string;
  title: string;
  description: string;
  params: Record<string, any>;
  builderPath: string;
  isDisabled?: boolean;
  onAdd?: () => void; // Optional callback after successful add
}

const ComposerButton = ({
  type,
  title,
  description,
  params,
  builderPath,
  isDisabled = false,
  onAdd,
}: ComposerButtonProps) => {
  const { addOperation } = useComposer();
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const toast = useToast();

  const handleAddToComposer = async () => {
    try {
      setIsLoading(true);

      // Validate params before adding
      if (!params || typeof params !== "object") {
        throw new Error("Invalid payload parameters");
      }

      // Create the operation
      const operation = {
        id: generateUniqueId(),
        type,
        title,
        description,
        params: { ...params },
        builderPath,
      };

      // Add to composer
      addOperation(operation);

      // Show success feedback
      setJustAdded(true);
      toast({
        title: "Added to Composer",
        description: `"${title}" has been added to your payload composer`,
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
      colorScheme={justAdded ? "green" : "blue"}
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
