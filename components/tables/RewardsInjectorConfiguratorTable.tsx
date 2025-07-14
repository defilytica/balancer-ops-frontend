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
  Tooltip,
  useColorModeValue,
  TableContainer,
  Alert,
  AlertIcon,
  Input,
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

  if (!data || data.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text>No current configuration</Text>
      </Alert>
    );
  }

  return (
    <>
      <TableContainer
        w="full"
        borderColor="transparent"
        borderRadius="xl"
        borderWidth="1px"
        shadow="md"
        p={2}
      >
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Pool / Gauge</Th>
              <Th isNumeric>Amount per Period</Th>
              <Th isNumeric>Periods</Th>
              <Th>Start Time</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((gauge, index) => {
              return (
                <Tr key={gauge.id || gauge.gaugeAddress} _hover={{ bg: "whiteAlpha.50" }}>
                  <Td>
                    <HStack spacing={2} align="center">
                      <Box>
                        <HStack spacing={2} align="center">
                          <Text fontWeight="medium" fontSize="sm">
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
                        <Text fontSize="xs" color={mutedTextColor} fontFamily="mono" mt={0.5}>
                          {gauge.poolName}
                        </Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td isNumeric>
                    {editingIndex === index ? (
                      <Box>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingData?.amountPerPeriod || ""}
                          onChange={e => handleFieldChange("amountPerPeriod", e.target.value)}
                          size="sm"
                          width="80px"
                          textAlign="right"
                        />
                      </Box>
                    ) : (
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">
                          {gauge.amountPerPeriod} {tokenSymbol}
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor} mt={0.5}>
                          Raw: {gauge.rawAmountPerPeriod}
                        </Text>
                      </Box>
                    )}
                  </Td>
                  <Td isNumeric>
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        min="1"
                        max="255"
                        value={editingData?.maxPeriods || ""}
                        onChange={e => handleFieldChange("maxPeriods", e.target.value)}
                        size="sm"
                        width="60px"
                        textAlign="right"
                      />
                    ) : (
                      <Text>
                        {gauge.periodNumber} / {gauge.maxPeriods}
                      </Text>
                    )}
                  </Td>
                  <Td>
                    {editingIndex === index ? (
                      <InjectorDateTimePicker
                        value={editingData?.doNotStartBeforeTimestamp || "0"}
                        onChange={(value: string) =>
                          handleFieldChange("doNotStartBeforeTimestamp", value)
                        }
                      />
                    ) : (
                      <Text fontSize="sm">
                        {formatTimestamp(gauge.doNotStartBeforeTimestamp || "0")}
                      </Text>
                    )}
                  </Td>
                  <Td>
                    {editingIndex === index ? (
                      <HStack spacing={1.5}>
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
                      <HStack spacing={1.5}>
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
                <Td>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={newRecipientData.gaugeAddress}
                    onChange={e => handleNewRecipientChange("gaugeAddress", e.target.value)}
                    size="sm"
                    fontFamily="mono"
                  />
                </Td>
                <Td isNumeric>
                  <Box>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={newRecipientData.amountPerPeriod}
                      onChange={e => handleNewRecipientChange("amountPerPeriod", e.target.value)}
                      size="sm"
                      width="100px"
                      textAlign="right"
                    />
                  </Box>
                </Td>
                <Td isNumeric>
                  <Input
                    type="number"
                    min="1"
                    max="255"
                    placeholder="Periods"
                    value={newRecipientData.maxPeriods}
                    onChange={e => handleNewRecipientChange("maxPeriods", e.target.value)}
                    size="sm"
                    textAlign="right"
                  />
                </Td>
                <Td>
                  <InjectorDateTimePicker
                    value={newRecipientData.doNotStartBeforeTimestamp || "0"}
                    onChange={(value: string) =>
                      handleNewRecipientChange("doNotStartBeforeTimestamp", value)
                    }
                  />
                </Td>
                <Td>
                  <HStack spacing={1.5}>
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
      {onAddRecipient && (
        <Flex justifyContent="flex-end" mt={4}>
          <Button
            leftIcon={<AddIcon />}
            onClick={() => setIsAddingRecipient(!isAddingRecipient)}
            colorScheme="green"
            variant="outline"
            isDisabled={isAddingRecipient}
            size="sm"
          >
            Add Recipient
          </Button>
        </Flex>
      )}
    </>
  );
};
