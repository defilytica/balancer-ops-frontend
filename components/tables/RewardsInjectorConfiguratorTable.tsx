import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Button,
  IconButton,
  HStack,
  VStack,
  Tooltip,
  useColorModeValue,
  useMediaQuery,
  TableContainer,
  Input,
  Card,
  CardBody,
  Divider,
  FormLabel,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, CheckIcon, CloseIcon, AddIcon } from "@chakra-ui/icons";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { InjectorDateTimePicker } from "@/components/InjectorDateTimePicker";
import { ethers } from "ethers";

interface RewardsInjectorConfiguratorTableProps {
  data: RewardsInjectorData[];
  tokenSymbol: string;
  tokenDecimals: number;
  onDelete?: (index: number, gauge: RewardsInjectorData) => void;
  onSaveEdit?: (index: number, updatedGauge: RewardsInjectorData) => void;
  onAddRecipient?: (newGauge: RewardsInjectorData) => void;
  newlyAddedGauges?: RewardsInjectorData[];
}

export const RewardsInjectorConfiguratorTable = ({
  data,
  tokenSymbol,
  tokenDecimals,
  onDelete,
  onSaveEdit,
  onAddRecipient,
  newlyAddedGauges = [],
}: RewardsInjectorConfiguratorTableProps) => {
  const configButtonColor = useColorModeValue("gray.500", "gray.400");
  const configButtonHoverColor = useColorModeValue("gray.600", "gray.300");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const [isMobile] = useMediaQuery("(max-width: 48em)");

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<RewardsInjectorData | null>(null);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [newRecipientData, setNewRecipientData] = useState<RewardsInjectorData>({
    gaugeAddress: "",
    poolName: "",
    amountPerPeriod: "",
    rawAmountPerPeriod: "0",
    periodNumber: "0",
    maxPeriods: "",
    isRewardTokenSetup: true,
    lastInjectionTimeStamp: "0",
    doNotStartBeforeTimestamp: "0",
  });

  const convertToRawAmount = (amount: string): string => {
    try {
      return ethers.parseUnits(amount, tokenDecimals).toString();
    } catch (error) {
      console.error("Error converting to raw amount:", error);
      return "0";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (timestamp === "0") return "Immediate start";
    try {
      return new Date(parseInt(timestamp) * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  const handleFieldChange = (field: keyof RewardsInjectorData, value: string) => {
    if (!editingData) return;

    const updatedGauge = { ...editingData };

    // Properly type the field assignment based on the field type
    if (field === "isRewardTokenSetup") {
      (updatedGauge as any)[field] = value === "true";
    } else {
      (updatedGauge as any)[field] = value;
    }

    // If editing amount per period, recalculate raw amount
    if (field === "amountPerPeriod") {
      try {
        updatedGauge.rawAmountPerPeriod = convertToRawAmount(value);
      } catch (error) {
        console.error("Error calculating raw amount:", error);
      }
    }

    setEditingData(updatedGauge);
  };

  const handleSave = (index: number) => {
    if (!editingData || !onSaveEdit) return;
    onSaveEdit(index, editingData);
    setEditingIndex(null);
    setEditingData(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditingData(null);
  };

  const handleNewRecipientChange = (field: keyof RewardsInjectorData, value: string) => {
    const updatedData = { ...newRecipientData };

    if (field === "isRewardTokenSetup") {
      (updatedData as any)[field] = value === "true";
    } else {
      (updatedData as any)[field] = value;
    }

    // If editing amount per period, recalculate raw amount
    if (field === "amountPerPeriod") {
      try {
        updatedData.rawAmountPerPeriod = convertToRawAmount(value);
      } catch (error) {
        console.error("Error calculating raw amount:", error);
        updatedData.rawAmountPerPeriod = "0";
      }
    }

    setNewRecipientData(updatedData);
  };

  const handleAddRecipient = () => {
    if (onAddRecipient) {
      onAddRecipient(newRecipientData);
      // Reset form and exit add mode
      setNewRecipientData({
        gaugeAddress: "",
        poolName: "",
        amountPerPeriod: "",
        rawAmountPerPeriod: "0",
        periodNumber: "0",
        maxPeriods: "",
        isRewardTokenSetup: true,
        lastInjectionTimeStamp: "0",
        doNotStartBeforeTimestamp: "0",
      });
      setIsAddingRecipient(false);
    }
  };

  const handleCancelAdd = () => {
    setNewRecipientData({
      gaugeAddress: "",
      poolName: "",
      amountPerPeriod: "",
      rawAmountPerPeriod: "0",
      periodNumber: "0",
      maxPeriods: "",
      isRewardTokenSetup: true,
      lastInjectionTimeStamp: "0",
      doNotStartBeforeTimestamp: "0",
    });
    setIsAddingRecipient(false);
  };

  // Initialize editing data when entering edit mode
  useEffect(() => {
    if (
      editingIndex !== null &&
      editingIndex !== undefined &&
      editingIndex >= 0 &&
      editingIndex < data.length
    ) {
      // When editing, reset periodNumber to 0 to create a fresh configuration
      setEditingData({
        ...data[editingIndex],
        periodNumber: "0",
      });
    } else {
      setEditingData(null);
    }
  }, [editingIndex, data]);

  const EmptyState = () => (
    <Box
      textAlign="center"
      py={12}
      px={6}
      borderColor="transparent"
      borderRadius="xl"
      borderWidth="1px"
      shadow="md"
    >
      <VStack>
        <Text fontSize="lg" fontWeight="medium">
          No current configuration
        </Text>
        <Text fontSize="md" color={mutedTextColor}>
          Add your first reward recipient to get started
        </Text>
        {onAddRecipient && (
          <Button
            leftIcon={<AddIcon />}
            mt={4}
            onClick={() => setIsAddingRecipient(true)}
            colorScheme="green"
            variant="outline"
            size="lg"
            px={8}
          >
            Add Recipient
          </Button>
        )}
      </VStack>
    </Box>
  );

  // Handle empty data - if we're adding a recipient, we'll show the table below with just the add row
  const hasData = data && data.length > 0;

  // Mobile Card Layout
  const MobileCard = ({ gauge, index }: { gauge: RewardsInjectorData; index: number }) => {
    const isNewlyAdded = newlyAddedGauges.some(newGauge => newGauge.id === gauge.id);
    const isEditing = editingIndex === index;

    return (
      <Card key={gauge.id || gauge.gaugeAddress} variant="outline" size="sm">
        <CardBody p={4}>
          <VStack spacing={3} align="stretch">
            {/* Header with address and badges */}
            <HStack justify="space-between" align="flex-start">
              <VStack align="flex-start" spacing={1} flex={1}>
                <Text fontWeight="medium" fontSize="sm" fontFamily="mono" wordBreak="break-all">
                  {gauge.gaugeAddress}
                </Text>
                <Text fontSize="xs" color={mutedTextColor} noOfLines={2}>
                  {gauge.poolName}
                </Text>
              </VStack>
              <VStack spacing={1}>
                {isNewlyAdded && (
                  <Badge colorScheme="green" size="sm">
                    NEW
                  </Badge>
                )}
                {gauge.isEdited && (
                  <Badge colorScheme="orange" size="sm">
                    EDITED
                  </Badge>
                )}
              </VStack>
            </HStack>

            <Divider />

            {/* Amount per Period */}
            <Box>
              <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
                Amount per Period
              </FormLabel>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editingData?.amountPerPeriod || ""}
                  onChange={e => handleFieldChange("amountPerPeriod", e.target.value)}
                  size="sm"
                />
              ) : (
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="bold" fontSize="sm">
                    {gauge.amountPerPeriod} {tokenSymbol}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor} fontFamily="mono">
                    Raw: {gauge.rawAmountPerPeriod}
                  </Text>
                </VStack>
              )}
            </Box>

            {/* Periods */}
            <Box>
              <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
                Periods
              </FormLabel>
              {isEditing ? (
                <Input
                  type="number"
                  min="1"
                  max="255"
                  value={editingData?.maxPeriods || ""}
                  onChange={e => handleFieldChange("maxPeriods", e.target.value)}
                  size="sm"
                />
              ) : (
                <Text fontSize="sm" fontWeight="medium">
                  {gauge.periodNumber} / {gauge.maxPeriods}
                </Text>
              )}
            </Box>

            {/* Start Time */}
            <Box>
              <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
                Start Time
              </FormLabel>
              {isEditing ? (
                <InjectorDateTimePicker
                  value={editingData?.doNotStartBeforeTimestamp || "0"}
                  onChange={(value: string) =>
                    handleFieldChange("doNotStartBeforeTimestamp", value)
                  }
                />
              ) : (
                <Text fontSize="sm" fontWeight="medium">
                  {formatTimestamp(gauge.doNotStartBeforeTimestamp || "0")}
                </Text>
              )}
            </Box>

            <Divider />

            {/* Actions */}
            <HStack justify="flex-end" spacing={2}>
              {isEditing ? (
                <>
                  <Button
                    leftIcon={<CheckIcon />}
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    onClick={() => handleSave(index)}
                  >
                    Save
                  </Button>
                  <Button
                    leftIcon={<CloseIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    leftIcon={<EditIcon />}
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingIndex(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    leftIcon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => onDelete?.(index, gauge)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Mobile Add Form
  const MobileAddForm = () => (
    <Card variant="outline" size="sm">
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          <Text fontWeight="medium" fontSize="sm">
            Add New Recipient
          </Text>

          <Box>
            <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
              Gauge Address
            </FormLabel>
            <Input
              type="text"
              placeholder="0x..."
              value={newRecipientData.gaugeAddress}
              onChange={e => handleNewRecipientChange("gaugeAddress", e.target.value)}
              size="sm"
              fontFamily="mono"
            />
          </Box>

          <Box>
            <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
              Amount per Period
            </FormLabel>
            <Input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newRecipientData.amountPerPeriod}
              onChange={e => handleNewRecipientChange("amountPerPeriod", e.target.value)}
              size="sm"
            />
          </Box>

          <Box>
            <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
              Max Periods
            </FormLabel>
            <Input
              type="number"
              min="1"
              max="255"
              placeholder="Periods"
              value={newRecipientData.maxPeriods}
              onChange={e => handleNewRecipientChange("maxPeriods", e.target.value)}
              size="sm"
            />
          </Box>

          <Box>
            <FormLabel fontSize="xs" color={mutedTextColor} mb={1}>
              Start Time
            </FormLabel>
            <InjectorDateTimePicker
              value={newRecipientData.doNotStartBeforeTimestamp || "0"}
              onChange={(value: string) =>
                handleNewRecipientChange("doNotStartBeforeTimestamp", value)
              }
            />
          </Box>

          <HStack justify="flex-end" spacing={2}>
            <Button
              leftIcon={<CheckIcon />}
              size="sm"
              colorScheme="green"
              variant="outline"
              onClick={handleAddRecipient}
            >
              Add
            </Button>
            <Button
              leftIcon={<CloseIcon />}
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={handleCancelAdd}
            >
              Cancel
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <Box w="full">
        {!hasData && !isAddingRecipient ? (
          <EmptyState />
        ) : (
          <>
            <VStack spacing={4} align="stretch">
              {hasData &&
                data.map((gauge, index) => (
                  <MobileCard key={gauge.id || gauge.gaugeAddress} gauge={gauge} index={index} />
                ))}

              {isAddingRecipient && <MobileAddForm />}
            </VStack>

            {onAddRecipient && hasData && (
              <Box mt={6}>
                <Button
                  leftIcon={<AddIcon />}
                  onClick={() => setIsAddingRecipient(!isAddingRecipient)}
                  colorScheme="green"
                  variant="outline"
                  isDisabled={isAddingRecipient}
                  width="full"
                >
                  Add Recipient
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }

  // Desktop Table Layout
  return (
    <>
      {!hasData && !isAddingRecipient ? (
        <EmptyState />
      ) : (
        <>
          <TableContainer
            w="full"
            borderColor="transparent"
            borderRadius="xl"
            borderWidth="1px"
            shadow="md"
            p={4}
          >
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th py={4} fontSize="sm" fontWeight="semibold">
                    Pool / Gauge
                  </Th>
                  <Th py={4} fontSize="sm" fontWeight="semibold" isNumeric>
                    Amount per Period
                  </Th>
                  <Th py={4} fontSize="sm" fontWeight="semibold" isNumeric>
                    Periods
                  </Th>
                  <Th py={4} fontSize="sm" fontWeight="semibold">
                    Start Time
                  </Th>
                  <Th py={4} fontSize="sm" fontWeight="semibold">
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map((gauge, index) => {
                  return (
                    <Tr key={gauge.id || gauge.gaugeAddress} _hover={{ bg: "whiteAlpha.50" }}>
                      <Td py={6} pr={6}>
                        <VStack spacing={2} align="flex-start">
                          <HStack spacing={2} align="center">
                            <Text fontWeight="medium" fontSize="sm" fontFamily="mono">
                              {gauge.gaugeAddress}
                            </Text>
                            {(() => {
                              const isNewlyAdded = newlyAddedGauges.some(
                                newGauge => newGauge.id === gauge.id,
                              );

                              if (isNewlyAdded) {
                                return (
                                  <Badge colorScheme="green" size="sm">
                                    NEW
                                  </Badge>
                                );
                              } else if (gauge.isEdited) {
                                return (
                                  <Badge colorScheme="orange" size="sm">
                                    EDITED
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </HStack>
                          <Text fontSize="xs" color={mutedTextColor} maxW="300px" isTruncated>
                            {gauge.poolName}
                          </Text>
                        </VStack>
                      </Td>
                      <Td py={6} isNumeric>
                        {editingIndex === index ? (
                          <Box>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingData?.amountPerPeriod || ""}
                              onChange={e => handleFieldChange("amountPerPeriod", e.target.value)}
                              size="sm"
                              width="120px"
                              textAlign="right"
                            />
                          </Box>
                        ) : (
                          <VStack spacing={1} align="flex-end">
                            <Text fontWeight="bold" fontSize="sm">
                              {gauge.amountPerPeriod} {tokenSymbol}
                            </Text>
                            <Text fontSize="xs" color={mutedTextColor} fontFamily="mono">
                              Raw: {gauge.rawAmountPerPeriod}
                            </Text>
                          </VStack>
                        )}
                      </Td>
                      <Td py={6} isNumeric>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            min="1"
                            max="255"
                            value={editingData?.maxPeriods || ""}
                            onChange={e => handleFieldChange("maxPeriods", e.target.value)}
                            size="sm"
                            width="80px"
                            textAlign="right"
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="medium">
                            {gauge.periodNumber} / {gauge.maxPeriods}
                          </Text>
                        )}
                      </Td>
                      <Td py={6} minW="180px">
                        {editingIndex === index ? (
                          <InjectorDateTimePicker
                            value={editingData?.doNotStartBeforeTimestamp || "0"}
                            onChange={(value: string) =>
                              handleFieldChange("doNotStartBeforeTimestamp", value)
                            }
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="medium">
                            {formatTimestamp(gauge.doNotStartBeforeTimestamp || "0")}
                          </Text>
                        )}
                      </Td>
                      <Td py={6}>
                        {editingIndex === index ? (
                          <HStack spacing={2}>
                            <Tooltip label="Save changes">
                              <IconButton
                                aria-label="Save"
                                icon={<CheckIcon />}
                                size="sm"
                                variant="outline"
                                colorScheme="green"
                                onClick={() => handleSave(index)}
                              />
                            </Tooltip>
                            <Tooltip label="Cancel edit">
                              <IconButton
                                aria-label="Cancel"
                                icon={<CloseIcon />}
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                onClick={handleCancel}
                              />
                            </Tooltip>
                          </HStack>
                        ) : (
                          <HStack spacing={2}>
                            <Tooltip label="Edit configuration">
                              <IconButton
                                aria-label="Edit"
                                icon={<EditIcon />}
                                size="sm"
                                variant="outline"
                                borderColor={configButtonColor}
                                color={configButtonColor}
                                _hover={{
                                  color: configButtonHoverColor,
                                  borderColor: configButtonHoverColor,
                                }}
                                onClick={() => setEditingIndex(index)}
                              />
                            </Tooltip>
                            <Tooltip label="Remove configuration">
                              <IconButton
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="outline"
                                borderColor="red.500"
                                color="red.500"
                                _hover={{
                                  color: "red.600",
                                  borderColor: "red.600",
                                }}
                                onClick={() => onDelete?.(index, gauge)}
                              />
                            </Tooltip>
                          </HStack>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
                {isAddingRecipient && (
                  <Tr>
                    <Td py={6} pr={6}>
                      <Input
                        type="text"
                        placeholder="0x..."
                        value={newRecipientData.gaugeAddress}
                        onChange={e => handleNewRecipientChange("gaugeAddress", e.target.value)}
                        size="sm"
                        fontFamily="mono"
                        width="full"
                      />
                    </Td>
                    <Td py={6} isNumeric>
                      <Box>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={newRecipientData.amountPerPeriod}
                          onChange={e =>
                            handleNewRecipientChange("amountPerPeriod", e.target.value)
                          }
                          size="sm"
                          width="120px"
                          textAlign="right"
                        />
                      </Box>
                    </Td>
                    <Td py={6} isNumeric>
                      <Input
                        type="number"
                        min="1"
                        max="255"
                        placeholder="Periods"
                        value={newRecipientData.maxPeriods}
                        onChange={e => handleNewRecipientChange("maxPeriods", e.target.value)}
                        size="sm"
                        width="80px"
                        textAlign="right"
                      />
                    </Td>
                    <Td py={6} minW="180px">
                      <InjectorDateTimePicker
                        value={newRecipientData.doNotStartBeforeTimestamp || "0"}
                        onChange={(value: string) =>
                          handleNewRecipientChange("doNotStartBeforeTimestamp", value)
                        }
                      />
                    </Td>
                    <Td py={6}>
                      <HStack spacing={2}>
                        <Tooltip label="Add recipient">
                          <IconButton
                            aria-label="Add"
                            icon={<CheckIcon />}
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            onClick={handleAddRecipient}
                          />
                        </Tooltip>
                        <Tooltip label="Cancel add">
                          <IconButton
                            aria-label="Cancel"
                            icon={<CloseIcon />}
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={handleCancelAdd}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
          {onAddRecipient && hasData && (
            <Flex justifyContent="flex-end" mt={6}>
              <Button
                leftIcon={<AddIcon />}
                onClick={() => setIsAddingRecipient(!isAddingRecipient)}
                colorScheme="green"
                variant="outline"
                isDisabled={isAddingRecipient}
              >
                Add Recipient
              </Button>
            </Flex>
          )}
        </>
      )}
    </>
  );
};
