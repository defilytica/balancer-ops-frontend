import React, { useState, useEffect } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Button,
  Flex,
  Box,
  Text,
  VStack,
  HStack,
  useMediaQuery,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, InfoIcon } from "@chakra-ui/icons";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { ethers } from "ethers";

interface EditableInjectorConfigProps {
  data: RewardsInjectorData[];
  tokenSymbol: string;
  tokenDecimals: number;
  onConfigChange: (newConfig: RewardsInjectorData[]) => void;
}

export const EditableInjectorConfig: React.FC<EditableInjectorConfigProps> = ({
  data,
  tokenSymbol,
  tokenDecimals,
  onConfigChange,
}) => {
  const [config, setConfig] = useState<RewardsInjectorData[]>(data);
  const [isMobile] = useMediaQuery("(max-width: 48em)");

  useEffect(() => {
    setConfig(data);
  }, [data]);

  const convertToRawAmount = (amount: string): string => {
    try {
      const rawAmount = ethers.parseUnits(amount, tokenDecimals);
      return rawAmount.toString();
    } catch (error) {
      console.error("Error converting to raw amount:", error);
      return "0";
    }
  };

  const handleInputChange = (index: number, field: keyof RewardsInjectorData, value: string) => {
    const newConfig = [...config];
    if (field === "amountPerPeriod") {
      newConfig[index] = {
        ...newConfig[index],
        [field]: value,
        rawAmountPerPeriod: convertToRawAmount(value),
      };
    } else {
      newConfig[index] = { ...newConfig[index], [field]: value };
    }
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleAddRow = () => {
    const newRow: RewardsInjectorData = {
      gaugeAddress: "",
      poolName: "",
      amountPerPeriod: "",
      rawAmountPerPeriod: "0",
      periodNumber: "0",
      maxPeriods: "",
      isRewardTokenSetup: true,
      lastInjectionTimeStamp: "0",
    };
    setConfig([...config, newRow]);
    onConfigChange([...config, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const newConfig = config.filter((_, i) => i !== index);
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  if (isMobile) {
    return (
      <VStack spacing={4} align="stretch">
        {config.map((row, index) => (
          <Box key={index} borderWidth={1} borderRadius="md" p={4}>
            <VStack align="stretch" spacing={2}>
              <Input
                placeholder="Gauge Address"
                value={row.gaugeAddress}
                onChange={e => handleInputChange(index, "gaugeAddress", e.target.value)}
              />
              {row.poolName && <Text>Pool Name: {row.poolName}</Text>}
              <Input
                placeholder={`Amount Per Period (${tokenSymbol})`}
                value={row.amountPerPeriod}
                onChange={e => handleInputChange(index, "amountPerPeriod", e.target.value)}
              />
              <Text fontSize="sm" color="gray.500">
                Raw Amount: {row.rawAmountPerPeriod || "0"}
              </Text>
              <Input
                placeholder="Max Periods"
                value={row.maxPeriods}
                onChange={e => handleInputChange(index, "maxPeriods", e.target.value)}
              />
              <IconButton
                aria-label="Delete row"
                icon={<DeleteIcon />}
                onClick={() => handleDeleteRow(index)}
              />
            </VStack>
          </Box>
        ))}
        <Button leftIcon={<AddIcon />} onClick={handleAddRow}>
          Add Row
        </Button>
      </VStack>
    );
  }

  return (
    <Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Gauge Address</Th>
            <Th>Pool Name</Th>
            <Th>Amount Per Period ({tokenSymbol})</Th>
            <Th>Raw Amount</Th>
            <Th>Max Periods</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {config.map((row, index) => (
            <Tr key={index}>
              <Td>
                <Input
                  value={row.gaugeAddress}
                  onChange={e => handleInputChange(index, "gaugeAddress", e.target.value)}
                />
              </Td>
              <Td>{row.poolName || "-"}</Td>
              <Td>
                <Input
                  value={row.amountPerPeriod}
                  onChange={e => handleInputChange(index, "amountPerPeriod", e.target.value)}
                />
              </Td>
              <Td>
                <Tooltip label={`Raw amount with ${tokenDecimals} decimals`}>
                  <Flex alignItems="center">
                    <Text mr={2}>{row.rawAmountPerPeriod || "0"}</Text>
                    <InfoIcon />
                  </Flex>
                </Tooltip>
              </Td>
              <Td>
                <Input
                  value={row.maxPeriods}
                  onChange={e => handleInputChange(index, "maxPeriods", e.target.value)}
                />
              </Td>
              <Td>
                <IconButton
                  aria-label="Delete row"
                  icon={<DeleteIcon />}
                  onClick={() => handleDeleteRow(index)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button leftIcon={<AddIcon />} onClick={handleAddRow} mt={4}>
        Add Row
      </Button>
    </Box>
  );
};
