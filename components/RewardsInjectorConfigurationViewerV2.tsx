import React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Tooltip,
  useColorModeValue,
  Icon,
  Alert,
  AlertIcon,
  Divider,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { InfoIcon, CopyIcon, DeleteIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import EditableInjectorConfigV2 from "./EditableInjectorConfigV2";
import { AiOutlineClear } from "react-icons/ai";

interface RewardsInjectorData {
  gaugeAddress: string;
  poolName: string;
  amountPerPeriod: string;
  rawAmountPerPeriod: string;
  periodNumber: string;
  maxPeriods: string;
  isRewardTokenSetup: boolean;
  lastInjectionTimeStamp: string;
}

interface RewardsInjectorConfigurationViewerV2Props {
  data: RewardsInjectorData[];
  tokenSymbol: string;
  tokenDecimals: number;
  onCopyConfiguration?: (config: {
    gaugeAddress: string;
    amountPerPeriod: string;
    rawAmountPerPeriod: string;
    maxPeriods: string;
    doNotStartBeforeTimestamp: string;
  }) => void;
  onEditConfiguration?: (config: RewardsInjectorData) => void;
  onAddToRemove?: (gaugeAddress: string) => void;
  showCopyButtons?: boolean;
  showTrashButtons?: boolean;
  showEditButtons?: boolean;
  editingGaugeId?: string | null;
  editingData?: {
    recipients: string[];
    amountPerPeriod: string;
    maxPeriods: string;
    doNotStartBeforeTimestamp: string;
    rawAmountPerPeriod: string;
  } | null;
  onEditingDataChange?: (data: {
    recipients: string[];
    amountPerPeriod: string;
    maxPeriods: string;
    doNotStartBeforeTimestamp: string;
    rawAmountPerPeriod: string;
  }) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  editedConfigs?: Map<
    string,
    {
      recipients: string[];
      amountPerPeriod: string;
      maxPeriods: string;
      doNotStartBeforeTimestamp: string;
      rawAmountPerPeriod: string;
    }
  >;
  onResetEditedConfiguration?: (gaugeAddress: string) => void;
}

export const RewardsInjectorConfigurationViewerV2: React.FC<
  RewardsInjectorConfigurationViewerV2Props
> = ({
  data,
  tokenSymbol,
  tokenDecimals,
  onCopyConfiguration,
  onEditConfiguration,
  onAddToRemove,
  showCopyButtons = false,
  showTrashButtons = false,
  showEditButtons = false,
  editingGaugeId = null,
  editingData = null,
  onEditingDataChange,
  onSaveEdit,
  onCancelEdit,
  editedConfigs = new Map(),
  onResetEditedConfiguration,
}) => {
  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const modifiedBorderColor = useColorModeValue("blue.200", "blue.600");

  // Helper function to check if any field has been modified
  const hasAnyModifications = (gaugeAddress: string) => {
    if (!editedConfigs.has(gaugeAddress)) return false;
    const editedData = editedConfigs.get(gaugeAddress);
    const gauge = data.find(g => g.gaugeAddress === gaugeAddress);
    if (!editedData || !gauge) return false;

    return (
      editedData.amountPerPeriod !== gauge.amountPerPeriod ||
      editedData.maxPeriods !== gauge.maxPeriods ||
      editedData.doNotStartBeforeTimestamp !== "0" ||
      editedData.recipients.length > 1 ||
      editedData.recipients[0] !== gaugeAddress
    );
  };

  // Helper function to check if a specific field has been modified
  const isFieldModified = (
    gaugeAddress: string,
    field: "amountPerPeriod" | "maxPeriods" | "doNotStartBeforeTimestamp" | "recipients",
  ) => {
    if (!editedConfigs.has(gaugeAddress)) return false;
    const editedData = editedConfigs.get(gaugeAddress);
    const gauge = data.find(g => g.gaugeAddress === gaugeAddress);
    if (!editedData || !gauge) return false;

    switch (field) {
      case "amountPerPeriod":
        return editedData.amountPerPeriod !== gauge.amountPerPeriod;
      case "maxPeriods":
        return editedData.maxPeriods !== gauge.maxPeriods;
      case "doNotStartBeforeTimestamp":
        return editedData.doNotStartBeforeTimestamp !== "0";
      case "recipients":
        return editedData.recipients.length > 1 || editedData.recipients[0] !== gaugeAddress;
      default:
        return false;
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    if (timestamp === "0") return "Immediate start";
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const handleCopyConfiguration = (gauge: RewardsInjectorData) => {
    if (onCopyConfiguration) {
      onCopyConfiguration({
        gaugeAddress: gauge.gaugeAddress,
        amountPerPeriod: gauge.amountPerPeriod,
        rawAmountPerPeriod: gauge.rawAmountPerPeriod,
        maxPeriods: gauge.maxPeriods,
        doNotStartBeforeTimestamp: "0",
      });
    }
  };

  const handleEditConfiguration = (gauge: RewardsInjectorData) => {
    if (onEditConfiguration) {
      onEditConfiguration(gauge);
    }
  };

  const handleRemoveConfiguration = (gaugeAddress: string) => {
    if (onAddToRemove) {
      onAddToRemove(gaugeAddress);
    }
  };

  return (
    <Card variant="outline" width="full">
      <CardHeader>
        <HStack justify="space-between" align="center">
          <Heading size="md">Current Gauge Configurations</Heading>
          {data && data.length > 0 && (
            <Badge colorScheme="gray" variant="subtle">
              {data.length} Active
            </Badge>
          )}
        </HStack>
      </CardHeader>

      <CardBody>
        <VStack align="stretch" spacing={4}>
          {!data || data.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>No current configuration</Text>
            </Alert>
          ) : (
            data.map((gauge, index) => (
              <Box key={gauge.gaugeAddress}>
                {index > 0 && <Divider my={4} />}

                {/* Check if this gauge is being edited */}
                {editingGaugeId === gauge.gaugeAddress &&
                editingData &&
                onEditingDataChange &&
                onSaveEdit &&
                onCancelEdit ? (
                  // Show edit form for this gauge
                  <Box>
                    <HStack justifyContent="space-between" alignItems="center" mb={4}>
                      <Text fontWeight="medium" fontSize="lg">
                        Editing Configuration for {gauge.poolName}
                      </Text>
                      <HStack spacing={2}>
                        <Button
                          leftIcon={<CheckIcon />}
                          onClick={onSaveEdit}
                          colorScheme="green"
                          variant="outline"
                          size="sm"
                        >
                          Save Changes
                        </Button>
                        <Button
                          leftIcon={<CloseIcon />}
                          onClick={onCancelEdit}
                          variant="outline"
                          colorScheme="red"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </HStack>
                    </HStack>

                    <EditableInjectorConfigV2
                      initialData={editingData}
                      tokenSymbol={tokenSymbol}
                      tokenDecimals={tokenDecimals}
                      operation="add"
                      onConfigChange={onEditingDataChange}
                    />
                  </Box>
                ) : (
                  // Show normal view for this gauge
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <HStack justifyContent="space-between" alignItems="center" mb={2}>
                        <HStack spacing={2}>
                          <Text fontWeight="medium" color={mutedTextColor}>
                            Recipient
                          </Text>

                          {editedConfigs.has(gauge.gaugeAddress) && (
                            <Badge colorScheme="blue" variant="solid">
                              Edited
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2}>
                          {editedConfigs.has(gauge.gaugeAddress) ? (
                            // Edited state: Reset + Edit
                            <>
                              <Tooltip label="Undo all edits for this configuration.">
                                <IconButton
                                  aria-label="Reset configuration"
                                  icon={<AiOutlineClear />}
                                  size="sm"
                                  variant="outline"
                                  colorScheme="white"
                                  onClick={() => onResetEditedConfiguration?.(gauge.gaugeAddress)}
                                  isDisabled={editingGaugeId !== null}
                                />
                              </Tooltip>

                              {showEditButtons && onEditConfiguration && (
                                <Tooltip label="Edit this configuration in place">
                                  <IconButton
                                    aria-label="Edit configuration"
                                    icon={<EditIcon />}
                                    size="sm"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleEditConfiguration(gauge)}
                                    isDisabled={editingGaugeId !== null}
                                  />
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            // Unedited state: Edit + Copy + Remove
                            <>
                              {showEditButtons && onEditConfiguration && (
                                <Tooltip label="Edit this configuration in place">
                                  <IconButton
                                    aria-label="Edit configuration"
                                    icon={<EditIcon />}
                                    size="sm"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleEditConfiguration(gauge)}
                                    isDisabled={editingGaugeId !== null}
                                  />
                                </Tooltip>
                              )}

                              {showCopyButtons && onCopyConfiguration && (
                                <Tooltip label="Copy this configuration to Add Recipients section">
                                  <IconButton
                                    aria-label="Copy configuration"
                                    icon={<CopyIcon />}
                                    size="sm"
                                    variant="outline"
                                    colorScheme="green"
                                    onClick={() => handleCopyConfiguration(gauge)}
                                    isDisabled={editingGaugeId !== null}
                                  />
                                </Tooltip>
                              )}

                              {showTrashButtons && onAddToRemove && (
                                <Tooltip label="Add this address to Remove Recipients section">
                                  <IconButton
                                    aria-label="Add to remove section"
                                    icon={<DeleteIcon />}
                                    size="sm"
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={() => handleRemoveConfiguration(gauge.gaugeAddress)}
                                    isDisabled={editingGaugeId !== null}
                                  />
                                </Tooltip>
                              )}
                            </>
                          )}
                        </HStack>
                      </HStack>
                      <HStack
                        bg={bgColor}
                        p={4}
                        borderRadius="md"
                        justify="space-between"
                        borderWidth="1px"
                        borderColor={
                          isFieldModified(gauge.gaugeAddress, "recipients")
                            ? modifiedBorderColor
                            : borderColor
                        }
                      >
                        <VStack align="start" spacing={1} flex="1">
                          {isFieldModified(gauge.gaugeAddress, "recipients") ? (
                            // Show modified recipients list
                            <VStack align="start" spacing={2} width="100%">
                              {editedConfigs
                                .get(gauge.gaugeAddress)
                                ?.recipients.map((recipient: string, index: number) => (
                                  <HStack key={index} spacing={2} width="100%">
                                    <Text fontFamily="mono" fontSize="sm">
                                      {recipient}
                                    </Text>
                                    {index === 0 && (
                                      <Badge colorScheme="blue" size="xs">
                                        Original
                                      </Badge>
                                    )}
                                    {index > 0 && (
                                      <Badge colorScheme="green" size="xs">
                                        Added
                                      </Badge>
                                    )}
                                  </HStack>
                                ))}
                              <Text fontSize="xs" color={mutedTextColor} mt={1}>
                                Schedule applies to{" "}
                                {editedConfigs.get(gauge.gaugeAddress)?.recipients.length} recipient
                                {editedConfigs.get(gauge.gaugeAddress)?.recipients.length !== 1
                                  ? "s"
                                  : ""}
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                {gauge.poolName}
                              </Text>
                            </VStack>
                          ) : (
                            // Show original recipient
                            <>
                              <Text fontFamily="mono">{gauge.gaugeAddress}</Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                {gauge.poolName}
                              </Text>
                            </>
                          )}
                        </VStack>

                        <VStack align="end" spacing={2}>
                          <Badge colorScheme={gauge.isRewardTokenSetup ? "green" : "yellow"}>
                            {gauge.isRewardTokenSetup ? "Active" : "Pending Setup"}
                          </Badge>
                        </VStack>
                      </HStack>
                    </Box>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                          Amount Per Period
                          {isFieldModified(gauge.gaugeAddress, "amountPerPeriod") && (
                            <Badge ml={2} colorScheme="blue" variant="subtle" size="sm">
                              Modified
                            </Badge>
                          )}
                        </Text>
                        <Box
                          bg={bgColor}
                          p={4}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={
                            isFieldModified(gauge.gaugeAddress, "amountPerPeriod")
                              ? modifiedBorderColor
                              : borderColor
                          }
                        >
                          <Text fontSize="lg" fontWeight="bold">
                            {isFieldModified(gauge.gaugeAddress, "amountPerPeriod")
                              ? `${editedConfigs.get(gauge.gaugeAddress)?.amountPerPeriod} ${tokenSymbol}`
                              : `${gauge.amountPerPeriod} ${tokenSymbol}`}
                          </Text>
                          <HStack spacing={2} mt={1} color={mutedTextColor}>
                            <Text fontSize="sm">Raw amount:</Text>
                            <Text fontSize="sm" fontFamily="mono">
                              {isFieldModified(gauge.gaugeAddress, "amountPerPeriod")
                                ? editedConfigs.get(gauge.gaugeAddress)?.rawAmountPerPeriod
                                : gauge.rawAmountPerPeriod}
                            </Text>
                            <Tooltip label={`Raw amount with ${tokenDecimals} decimals`}>
                              <Icon as={InfoIcon} />
                            </Tooltip>
                          </HStack>
                          {isFieldModified(gauge.gaugeAddress, "amountPerPeriod") && (
                            <Text fontSize="xs" color={mutedTextColor} mt={1}>
                              Original: {gauge.amountPerPeriod} {tokenSymbol}
                            </Text>
                          )}
                        </Box>
                      </Box>

                      <Box>
                        <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                          Periods
                          {isFieldModified(gauge.gaugeAddress, "maxPeriods") && (
                            <Badge ml={2} colorScheme="blue" variant="subtle" size="sm">
                              Modified
                            </Badge>
                          )}
                        </Text>
                        <Box
                          bg={bgColor}
                          p={4}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={
                            isFieldModified(gauge.gaugeAddress, "maxPeriods")
                              ? modifiedBorderColor
                              : borderColor
                          }
                        >
                          <Text fontSize="lg" fontWeight="bold">
                            {gauge.periodNumber} /{" "}
                            {isFieldModified(gauge.gaugeAddress, "maxPeriods")
                              ? editedConfigs.get(gauge.gaugeAddress)?.maxPeriods
                              : gauge.maxPeriods}
                          </Text>
                          <Text fontSize="sm" color={mutedTextColor} mt={1}>
                            Current / Maximum weekly periods
                          </Text>
                          {isFieldModified(gauge.gaugeAddress, "maxPeriods") && (
                            <Text fontSize="xs" color={mutedTextColor} mt={1}>
                              Original max: {gauge.maxPeriods}
                            </Text>
                          )}
                        </Box>
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                        Last Injection Time
                      </Text>
                      <Box
                        bg={bgColor}
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Text fontFamily="mono">
                          {formatTimestamp(gauge.lastInjectionTimeStamp)} -{" "}
                          {gauge.lastInjectionTimeStamp}
                        </Text>
                      </Box>
                    </Box>

                    {isFieldModified(gauge.gaugeAddress, "doNotStartBeforeTimestamp") && (
                      <Box>
                        <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                          New Start Time
                          <Badge ml={2} colorScheme="blue" variant="subtle" size="sm">
                            Modified
                          </Badge>
                        </Text>
                        <Box
                          bg={bgColor}
                          p={4}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={modifiedBorderColor}
                        >
                          <Text fontFamily="mono">
                            {formatTimestamp(
                              editedConfigs.get(gauge.gaugeAddress)?.doNotStartBeforeTimestamp ||
                                "0",
                            )}{" "}
                            - {editedConfigs.get(gauge.gaugeAddress)?.doNotStartBeforeTimestamp}
                          </Text>
                          <Text fontSize="xs" color={mutedTextColor} mt={1}>
                            This will be the new "Do Not Start Before" time
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </VStack>
                )}
              </Box>
            ))
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};
