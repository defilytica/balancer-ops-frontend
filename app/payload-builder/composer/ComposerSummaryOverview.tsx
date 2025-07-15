"use client";

import React, { useMemo } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Icon,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Skeleton,
  Flex,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { CheckIcon, WarningIcon, InfoIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useComposer } from "./PayloadComposerContext";
import { AiOutlineDashboard } from "react-icons/ai";

export default function ComposerSummaryOverview() {
  const { operations, isMounted, combinationResult, compatibilityCheck, hasErrors, hasWarnings } =
    useComposer();

  const bgColor = useColorModeValue("white", "background.level2");
  const borderColor = useColorModeValue("gray.200", "border.base");
  const mutedText = useColorModeValue("gray.600", "font.secondary");
  const lightText = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.400", "gray.500");

  // Show loading skeleton during hydration to prevent mismatches
  if (!isMounted) {
    return (
      <VStack spacing={6} align="stretch">
        <Skeleton height="200px" borderRadius="lg" />
        <Skeleton height="120px" borderRadius="lg" />
        <Skeleton height="80px" borderRadius="lg" />
      </VStack>
    );
  }

  // Handle empty state
  if (operations.length === 0) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
        <VStack spacing={4} textAlign="center">
          <Icon as={InfoIcon} boxSize={8} color={iconColor} />
          <Text color={mutedText} fontSize="lg">
            No operations in Composer
          </Text>
          <Text color={lightText} fontSize="sm">
            Add some payload operations from any builder page to preview the combined transaction
          </Text>
        </VStack>
      </Box>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Status Overview */}
      <Box p={6} bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <HStack spacing={2}>
              <AiOutlineDashboard size={20} />
              <Text fontSize="xl" fontWeight="bold">
                Payload Overview
              </Text>
            </HStack>
            <HStack spacing={2}>
              {!hasErrors ? (
                <Badge colorScheme="green" variant="subtle">
                  <HStack spacing={1}>
                    <Icon as={CheckIcon} boxSize={3} />
                    <Text>Valid</Text>
                  </HStack>
                </Badge>
              ) : (
                <Badge colorScheme="red" variant="subtle">
                  <HStack spacing={1}>
                    <Icon as={WarningIcon} boxSize={3} />
                    <Text>Invalid</Text>
                  </HStack>
                </Badge>
              )}
              {hasWarnings && (
                <Badge colorScheme="yellow" variant="subtle">
                  <HStack spacing={1}>
                    <Icon as={InfoIcon} boxSize={3} />
                    <Text>Warnings</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
          </HStack>

          {/* Metrics Grid */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel fontSize="sm">Operations</StatLabel>
              <StatNumber fontSize="lg">{combinationResult.metadata.totalOperations}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel fontSize="sm">Transactions</StatLabel>
              <StatNumber fontSize="lg">{combinationResult.metadata.totalTransactions}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel fontSize="sm">Payload Size</StatLabel>
              <StatNumber fontSize="lg">
                {formatBytes(combinationResult.metadata.payloadSizeBytes)}
              </StatNumber>
            </Stat>
          </SimpleGrid>

          {/* Networks and Operation Types */}
          <HStack spacing={4} wrap="wrap">
            <VStack align="start" spacing={2} flex="1">
              <Text fontSize="sm" fontWeight="medium" color={mutedText}>
                Networks:
              </Text>
              <HStack spacing={2} wrap="wrap">
                {combinationResult.metadata.networks.length > 0 ? (
                  combinationResult.metadata.networks.map(network => (
                    <Badge key={network} variant="outline" colorScheme="blue">
                      {network}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" colorScheme="gray">
                    Unknown
                  </Badge>
                )}
              </HStack>
            </VStack>

            <VStack align="start" spacing={2} flex="1">
              <Text fontSize="sm" fontWeight="medium" color={mutedText}>
                Operation Types:
              </Text>
              <HStack spacing={2} wrap="wrap">
                {combinationResult.metadata.operationTypes.map(type => (
                  <Badge key={type} variant="outline" colorScheme="purple">
                    {type}
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {(hasErrors || hasWarnings) && (
        <VStack spacing={3} align="stretch">
          {/* Errors */}
          {hasErrors && (
            <Alert status="error" py={3} variant="left-accent" borderRadius="md">
              <Box flex="1">
                <Flex align="center">
                  <AlertIcon />
                  <AlertTitle fontSize="lg">Errors</AlertTitle>
                </Flex>
                <AlertDescription display="block">
                  <List spacing={2} mt={2}>
                    {compatibilityCheck.blockingIssues.map((error, index) => (
                      <ListItem key={index} fontSize="sm">
                        <ListIcon as={ChevronRightIcon} />
                        {error}
                      </ListItem>
                    ))}
                    {combinationResult.errors.map((error, index) => (
                      <ListItem key={`tech-${index}`} fontSize="sm">
                        <ListIcon as={WarningIcon} color="red.500" />
                        {error}
                      </ListItem>
                    ))}
                  </List>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <Alert status="warning" py={3} variant="left-accent" borderRadius="md">
              <Box flex="1">
                <Flex align="center">
                  <AlertIcon />
                  <AlertTitle fontSize="lg">Warnings</AlertTitle>
                </Flex>
                <AlertDescription display="block">
                  <List spacing={2} mt={2}>
                    {compatibilityCheck.warningIssues.map((warning, index) => (
                      <ListItem key={index} fontSize="sm">
                        <ListIcon as={ChevronRightIcon} />
                        {warning}
                      </ListItem>
                    ))}
                  </List>
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      )}
    </VStack>
  );
}
