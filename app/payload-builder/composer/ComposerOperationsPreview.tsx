"use client";
import { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Heading,
  Card,
  CardBody,
  Badge,
  Flex,
  IconButton,
  Collapse,
  HStack,
  Alert,
  AlertIcon,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
  Skeleton,
  AlertTitle,
  ButtonGroup,
} from "@chakra-ui/react";
import { DeleteIcon, InfoIcon, ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useComposer } from "./PayloadComposerContext";
import { TbTransactionBitcoin } from "react-icons/tb";
import { getNetworkString } from "@/lib/utils/getNetworkString";

// Motion wrapper for cards
const MotionCard = motion(Card);

interface ComposerOperationsPreviewProps {
  hasManualEdits: boolean;
}

const ComposerOperationsPreview = ({ hasManualEdits }: ComposerOperationsPreviewProps) => {
  const { operations, removeOperation, clearAll, reorderOperations, operationCount, isMounted } =
    useComposer();

  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());
  const [recentlyMoved, setRecentlyMoved] = useState<string | null>(null);

  // Responsive values
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const cardSize = useBreakpointValue({ base: "sm", md: "md" });
  const spacing = useBreakpointValue({ base: 2, md: 3 });

  // Theme-aware colors
  const borderColor = useColorModeValue("gray.200", "border.base");
  const mutedText = useColorModeValue("gray.500", "font.secondary");
  const primaryText = useColorModeValue("gray.800", "font.primary");
  const payloadReadyBg = useColorModeValue("green.50", "rgba(56, 161, 105, 0.1)");
  const payloadReadyBorder = useColorModeValue("green.200", "rgba(56, 161, 105, 0.3)");
  const payloadReadyText = useColorModeValue("green.700", "green.300");
  const payloadReadyBadge = useColorModeValue("green.600", "green.400");
  const cardHoverBorder = useColorModeValue("gray.700", "gray.300");
  const reorderButtonBg = useColorModeValue("gray.50", "gray.700");
  const reorderButtonHover = useColorModeValue("gray.100", "gray.600");
  const highlightBg = useColorModeValue("blue.50", "rgba(66, 153, 225, 0.1)");
  const highlightBorder = useColorModeValue("blue.300", "rgba(66, 153, 225, 0.4)");

  const toggleOperationExpanded = (operationId: string) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(operationId)) {
      newExpanded.delete(operationId);
    } else {
      newExpanded.add(operationId);
    }
    setExpandedOperations(newExpanded);
  };

  const moveOperationUp = (index: number) => {
    if (index > 0) {
      const operation = operations[index];
      reorderOperations(index, index - 1);

      // Visual feedback
      setRecentlyMoved(operation.id);

      // Clear highlight after animation
      setTimeout(() => setRecentlyMoved(null), 800);
    }
  };

  const moveOperationDown = (index: number) => {
    if (index < operations.length - 1) {
      const operation = operations[index];
      reorderOperations(index, index + 1);

      // Visual feedback
      setRecentlyMoved(operation.id);

      // Clear highlight after animation
      setTimeout(() => setRecentlyMoved(null), 800);
    }
  };

  const renderOperationParams = (params: Record<string, any>, payload?: any) => {
    const filteredParams = Object.entries(params).filter(([, value]) => {
      // Filter out empty, null, or undefined values
      return value !== null && value !== undefined && value !== "" && value !== "0";
    });

    return (
      <VStack align="stretch" spacing={2}>
        {/* Payload Information */}
        {payload && (
          <Box
            p={2}
            bg={payloadReadyBg}
            borderRadius="md"
            border="1px"
            borderColor={payloadReadyBorder}
          >
            <HStack spacing={2} mb={1}>
              <Badge colorScheme="green" size="sm">
                ✓ Payload Ready
              </Badge>
              <Text fontSize="xs" color={payloadReadyBadge}>
                {payload.transactions?.length || 0} transaction(s)
              </Text>
            </HStack>
            <Text fontSize="xs" color={payloadReadyText}>
              Safe batch file generated and stored
            </Text>
          </Box>
        )}

        {/* Other Parameters */}
        {filteredParams.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Parameters:
            </Text>
            <VStack align="stretch" spacing={1}>
              {filteredParams.slice(0, 5).map(([key, value]) => (
                <Flex key={key} justify="space-between">
                  <Text fontSize="sm" color={mutedText} fontWeight="medium">
                    {key}:
                  </Text>
                  <Text fontSize="sm" color={primaryText} fontWeight="medium">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </Text>
                </Flex>
              ))}
              {filteredParams.length > 5 && (
                <Text fontSize="xs" color="blue.500" fontStyle="italic">
                  +{filteredParams.length - 5} more parameters...
                </Text>
              )}
            </VStack>
          </Box>
        )}

        {!payload && filteredParams.length === 0 && (
          <Text fontSize="xs" color={mutedText}>
            No parameters or payload
          </Text>
        )}
      </VStack>
    );
  };

  // Show loading skeleton during hydration to prevent mismatches
  if (!isMounted) {
    return (
      <VStack spacing={3} align="stretch">
        <Skeleton height="40px" borderRadius="md" />
        <Skeleton height="120px" borderRadius="md" />
        <Skeleton height="80px" borderRadius="md" />
      </VStack>
    );
  }

  return (
    <Card mt={4} borderColor={borderColor} borderWidth="2px" shadow="sm" position="relative">
      {/* Global disabled overlay */}
      {hasManualEdits && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(255, 255, 255, 0.2)"
          _dark={{ bg: "rgba(255, 255, 255, 0.1)" }}
          backdropFilter="blur(4px)"
          zIndex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
        >
          <VStack spacing={2} textAlign="center">
            <Text fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
              Operations Locked
            </Text>
            <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
              Payload was manually edited
            </Text>
          </VStack>
        </Box>
      )}

      <CardBody>
        <VStack spacing={spacing} align="stretch">
          {/* Header */}
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <HStack spacing={2}>
              <TbTransactionBitcoin size={20} />
              <Heading size="md">Operations</Heading>
            </HStack>

            <HStack spacing={2}>
              {operations.length > 0 && (
                <Button
                  size={buttonSize}
                  variant="outline"
                  colorScheme="red"
                  onClick={clearAll}
                  leftIcon={<DeleteIcon />}
                >
                  Clear All
                </Button>
              )}
            </HStack>
          </Flex>

          {/* Empty State */}
          {operations.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">Payload Composer is empty</Text>
                <Text fontSize="sm" color={mutedText}>
                  Add operations from the payload builders to get started.
                </Text>
              </Box>
            </Alert>
          ) : (
            <>
              <Alert status="success" borderRadius="md" variant="subtle">
                <AlertIcon />
                <AlertTitle>
                  {operationCount} operation{operationCount !== 1 ? "s" : ""} ready
                </AlertTitle>
              </Alert>

              {/* Operations List */}
              <Box>
                <VStack spacing={spacing} align="stretch">
                  <AnimatePresence>
                    {operations.map((operation, index) => {
                      const isRecentlyMoved = recentlyMoved === operation.id;

                      return (
                        <MotionCard
                          key={operation.id}
                          size={cardSize}
                          variant="outline"
                          borderWidth="1px"
                          bg={isRecentlyMoved ? highlightBg : "background.level1"}
                          borderColor={isRecentlyMoved ? highlightBorder : borderColor}
                          _hover={{ borderColor: cardHoverBorder, shadow: "sm" }}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            transition: { duration: 0.2, ease: "easeOut" },
                          }}
                          transition={{
                            layout: { duration: 0.2, ease: "easeInOut" },
                            opacity: { duration: 0.15 },
                          }}
                        >
                          <CardBody p={3}>
                            {/* Operation Header */}
                            <Flex justifyContent="space-between" alignItems="start" mb={2}>
                              <Box flex={1}>
                                <Flex alignItems="center" gap={2} mb={1}>
                                  <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                    #{index + 1}
                                  </Badge>
                                  <Text fontWeight="semibold" fontSize="sm" isTruncated>
                                    {operation.title}
                                  </Text>
                                </Flex>

                                <Text fontSize="xs" color={mutedText} mb={1} noOfLines={2}>
                                  {operation.description}
                                </Text>

                                <HStack spacing={4} fontSize="xs" color={mutedText}>
                                  <Text>Type: {operation.type}</Text>
                                  <Text>
                                    Added: {new Date(operation.timestamp).toLocaleTimeString()}
                                  </Text>
                                  {operation.payload?.chainId && (
                                    <Badge colorScheme="purple" variant="outline" fontSize="xs">
                                      {getNetworkString(Number(operation.payload.chainId))}
                                    </Badge>
                                  )}
                                </HStack>
                              </Box>

                              {/* Action Buttons */}
                              <HStack spacing={1}>
                                {/* Reorder buttons - only show if more than 1 operation */}
                                {operations.length > 1 && (
                                  <ButtonGroup
                                    size="xs"
                                    isAttached
                                    variant="outline"
                                    colorScheme="gray"
                                  >
                                    <Tooltip label="Move up">
                                      <IconButton
                                        aria-label="Move operation up"
                                        icon={<ArrowUpIcon />}
                                        isDisabled={index === 0}
                                        onClick={() => moveOperationUp(index)}
                                        bg={reorderButtonBg}
                                        _hover={{ bg: reorderButtonHover }}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Move down">
                                      <IconButton
                                        aria-label="Move operation down"
                                        icon={<ArrowDownIcon />}
                                        isDisabled={index === operations.length - 1}
                                        onClick={() => moveOperationDown(index)}
                                        bg={reorderButtonBg}
                                        _hover={{ bg: reorderButtonHover }}
                                      />
                                    </Tooltip>
                                  </ButtonGroup>
                                )}

                                {/* Details toggle */}
                                <Tooltip label="Show details">
                                  <IconButton
                                    aria-label="Show operation details"
                                    icon={<InfoIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => toggleOperationExpanded(operation.id)}
                                  />
                                </Tooltip>

                                {/* Remove button */}
                                <Tooltip label="Remove operation">
                                  <IconButton
                                    aria-label="Remove operation"
                                    icon={<DeleteIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => removeOperation(operation.id)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Flex>

                            {/* Expandable Details */}
                            <Collapse in={expandedOperations.has(operation.id)}>
                              <Box mt={2} pt={2} borderTop="1px solid" borderColor={borderColor}>
                                <Box p={2}>
                                  {renderOperationParams(operation.params, operation.payload)}
                                </Box>
                              </Box>
                            </Collapse>
                          </CardBody>
                        </MotionCard>
                      );
                    })}
                  </AnimatePresence>
                </VStack>
              </Box>

              {/* Actions Footer */}
              {operations.length > 1 && (
                <Box pt={2} borderTop="1px solid" borderColor={borderColor}>
                  <Text fontSize="sm" color={mutedText} fontWeight="medium">
                    💡 Tip: Use the arrow buttons to reorder operations in your transaction.
                  </Text>
                </Box>
              )}
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ComposerOperationsPreview;
