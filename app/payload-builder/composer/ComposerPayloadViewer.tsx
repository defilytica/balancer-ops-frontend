"use client";
import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Text,
  useToast,
  Divider,
  Flex,
  useColorModeValue,
  Skeleton,
} from "@chakra-ui/react";
import { CopyIcon, DownloadIcon, InfoIcon, EditIcon } from "@chakra-ui/icons";
import { useComposer } from "./PayloadComposerContext";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { copyJsonToClipboard, handleDownloadClick } from "../payloadHelperFunctions";

interface ComposerPayloadViewerProps {
  hasManualEdits: boolean;
  setHasManualEdits: (hasEdits: boolean) => void;
}

export default function ComposerPayloadViewer({
  hasManualEdits,
  setHasManualEdits,
}: ComposerPayloadViewerProps) {
  const { operations, isMounted, combinationResult, hasErrors, hasWarnings, compatibilityCheck } =
    useComposer();
  const [editedPayload, setEditedPayload] = useState<string>("");
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue("white", "background.level2");
  const borderColor = useColorModeValue("gray.200", "border.base");
  const mutedText = useColorModeValue("gray.600", "font.secondary");
  const lightText = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.400", "gray.500");

  // Format the payload for display
  const formattedPayload = useMemo(() => {
    if (!combinationResult.success || !combinationResult.payload || hasErrors) {
      return null;
    }
    return JSON.stringify(combinationResult.payload, null, 2);
  }, [combinationResult, hasErrors]);

  // Update edited payload when the base payload changes
  useEffect(() => {
    if (formattedPayload && !hasManualEdits) {
      setEditedPayload(formattedPayload);
    }
  }, [formattedPayload, hasManualEdits]);

  // Get the current payload to use (edited version or original)
  const currentPayload = hasManualEdits ? editedPayload : formattedPayload || "";

  const handleJsonChange = (newJson: string | any) => {
    const jsonString = typeof newJson === "string" ? newJson : JSON.stringify(newJson, null, 2);
    setEditedPayload(jsonString);
    setHasManualEdits(true);
  };

  const handleCopy = () => {
    if (currentPayload) {
      copyJsonToClipboard(currentPayload, toast);
    }
  };

  const handleDownload = () => {
    if (currentPayload) {
      handleDownloadClick(currentPayload);
    }
  };

  const handleResetToOriginal = () => {
    if (formattedPayload) {
      setEditedPayload(formattedPayload);
      setHasManualEdits(false);
      toast({
        title: "Reset to Original",
        description: "Payload has been reset to the generated version",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Show loading skeleton during hydration to prevent mismatches
  if (!isMounted) {
    return (
      <VStack spacing={6} align="stretch">
        <Skeleton height="200px" borderRadius="lg" />
        <Skeleton height="80px" borderRadius="lg" />
        <Skeleton height="400px" borderRadius="lg" />
      </VStack>
    );
  }

  // Handle empty or error states
  if (operations.length === 0) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
        <VStack spacing={4} textAlign="center">
          <InfoIcon boxSize={8} color={iconColor} />
          <Text color={mutedText} fontSize="lg">
            No operations to combine
          </Text>
          <Text color={lightText} fontSize="sm">
            Add operations to your Composer to generate a combined payload
          </Text>
        </VStack>
      </Box>
    );
  }

  if (hasErrors) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
        <VStack spacing={4} align="stretch">
          <Alert status="error">
            <AlertIcon />
            <VStack align="start" spacing={2} flex="1">
              <Text fontWeight="medium">Cannot Construct Payload</Text>
              <Text fontSize="sm">Please resolve the errors.</Text>
            </VStack>
          </Alert>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {hasManualEdits && (
        <Alert status="info">
          <Flex justifyContent="space-between" alignItems="center" flex="1">
            <AlertIcon />
            <VStack align="start" spacing={1} flex="1">
              <Box>
                <Text fontWeight="medium">Manual Edits Applied</Text>
                <Text fontSize="sm" color={mutedText} mt={1}>
                  The payload has been manually edited. Changes won't sync back to individual
                  operations above.
                </Text>
              </Box>
            </VStack>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<EditIcon />}
              onClick={handleResetToOriginal}
            >
              Reset To Original
            </Button>
          </Flex>
        </Alert>
      )}

      {/* Action Buttons */}
      <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={4}>
        <HStack spacing={2}>
          <Button
            variant="secondary"
            leftIcon={<CopyIcon />}
            onClick={handleCopy}
            isDisabled={!currentPayload}
          >
            Copy Payload
          </Button>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon />}
            onClick={handleDownload}
            isDisabled={!currentPayload}
          >
            Download Payload
          </Button>
        </HStack>

        {currentPayload && <SimulateTransactionButton batchFile={JSON.parse(currentPayload)} />}
      </Flex>

      <Divider />

      {/* Payload JSON Viewer */}
      {currentPayload && (
        <JsonViewerEditor jsonData={currentPayload} onJsonChange={handleJsonChange} />
      )}
    </VStack>
  );
}
