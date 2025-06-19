import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, InfoIcon, DeleteIcon } from "@chakra-ui/icons";
import { ethers } from "ethers";

interface RecipientConfigData {
  recipients: string[];
  amountPerPeriod: string;
  maxPeriods: string;
  doNotStartBeforeTimestamp: string;
  rawAmountPerPeriod: string;
}

interface EditableInjectorConfigV2Props {
  initialData?: RecipientConfigData;
  tokenSymbol: string;
  tokenDecimals: number;
  onConfigChange: (config: RecipientConfigData) => void;
  operation: "add" | "remove" | null;
}

const EditableInjectorConfigV2: React.FC<EditableInjectorConfigV2Props> = ({
  initialData,
  tokenSymbol,
  tokenDecimals,
  onConfigChange,
  operation,
}) => {
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  const [config, setConfig] = useState<RecipientConfigData>(
    initialData || {
      recipients: [""],
      amountPerPeriod: "",
      maxPeriods: "",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    },
  );

  // Helper local state for datetime input
  const [doNotStartBeforeDateTime, setDoNotStartBeforeDateTime] = useState<string>("");

  // Update local state when initialData changes (for copy configuration functionality)
  useEffect(() => {
    if (initialData) {
      setConfig(initialData);
    }
  }, [initialData]);

  // Helper function to get minimum datetime (current time)
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  // Helper function to convert datetime to Unix timestamp
  const convertDateTimeToTimestamp = (dateTimeString: string): string => {
    if (!dateTimeString) return "0";
    const timestamp = Math.floor(new Date(dateTimeString).getTime() / 1000);
    return timestamp.toString();
  };

  const convertToRawAmount = (amount: string): string => {
    try {
      return ethers.parseUnits(amount, tokenDecimals).toString();
    } catch (error) {
      console.error("Error converting to raw amount:", error);
      return "0";
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...config.recipients];
    newRecipients[index] = value;
    const newConfig = { ...config, recipients: newRecipients };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleInputChange = (field: keyof RecipientConfigData, value: string) => {
    const newConfig = { ...config };
    if (field === "amountPerPeriod") {
      newConfig.amountPerPeriod = value;
      newConfig.rawAmountPerPeriod = convertToRawAmount(value);
    } else {
      (newConfig[field] as any) = value;
    }
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleDateTimeChange = (dateTimeString: string) => {
    setDoNotStartBeforeDateTime(dateTimeString);
    const newConfig = {
      ...config,
      doNotStartBeforeTimestamp: convertDateTimeToTimestamp(dateTimeString),
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const addRecipient = () => {
    const newConfig = {
      ...config,
      recipients: [...config.recipients, ""],
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const removeRecipient = (index: number) => {
    const newConfig = {
      ...config,
      recipients: config.recipients.filter((_, i) => i !== index),
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  if (operation === null) {
    return null;
  }

  const renderAddOperation = () => (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontWeight="medium" mb={2}>
          Recipients
        </Text>
        <VStack spacing={3} align="stretch">
          {config.recipients.map((recipient, index) => (
            <HStack key={index}>
              <Input
                placeholder="Recipient address"
                value={recipient}
                onChange={e => handleRecipientChange(index, e.target.value)}
              />
              {config.recipients.length > 1 && (
                <IconButton
                  aria-label="Delete recipient"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecipient(index)}
                >
                  <DeleteIcon boxSize={4} />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button leftIcon={<AddIcon />} onClick={addRecipient} size="sm" variant="outline">
            Add Recipient
          </Button>
        </VStack>
      </Box>

      <HStack spacing={4} align="start">
        <Box flex="1">
          <Text fontWeight="medium" mb={2}>
            Amount Per Period ({tokenSymbol})
          </Text>
          <Input
            value={config.amountPerPeriod}
            onChange={e => handleInputChange("amountPerPeriod", e.target.value)}
            placeholder={`Enter amount in ${tokenSymbol}`}
          />
          <HStack mt={1}>
            <Text color={mutedTextColor}>Raw amount: {config.rawAmountPerPeriod}</Text>
            <Tooltip label={`Raw amount with ${tokenDecimals} decimals`}>
              <InfoIcon color={mutedTextColor} />
            </Tooltip>
          </HStack>
        </Box>
        <Box flex="1">
          <Text fontWeight="medium" mb={2}>
            Max Periods
          </Text>
          <Input
            type="number"
            value={config.maxPeriods}
            onChange={e => handleInputChange("maxPeriods", e.target.value)}
            placeholder="Number of weekly periods"
            min={1}
            max={255}
          />
        </Box>
      </HStack>

      <Box>
        <HStack mb={2}>
          <Text fontWeight="medium">Do Not Start Before</Text>
          <Tooltip label="Leave empty to start as soon as gauges are ready">
            <InfoIcon color={mutedTextColor} />
          </Tooltip>
        </HStack>
        <Input
          type="datetime-local"
          value={doNotStartBeforeDateTime}
          onChange={e => handleDateTimeChange(e.target.value)}
          min={getMinDateTime()}
        />
        {config.doNotStartBeforeTimestamp && config.doNotStartBeforeTimestamp !== "0" && (
          <Text mt={2} color={mutedTextColor}>
            Timestamp: {config.doNotStartBeforeTimestamp}
          </Text>
        )}
      </Box>
    </VStack>
  );

  const renderRemoveOperation = () => (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontWeight="medium" mb={2}>
          Recipients to Remove
        </Text>
        <VStack spacing={3} align="stretch">
          {config.recipients.map((recipient, index) => (
            <HStack key={index}>
              <Input
                placeholder="Recipient address to remove"
                value={recipient}
                onChange={e => handleRecipientChange(index, e.target.value)}
              />
              {config.recipients.length > 1 && (
                <IconButton
                  aria-label="Delete recipient"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecipient(index)}
                >
                  <DeleteIcon boxSize={4} />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button
            variant="outline"
            leftIcon={<AddIcon />}
            size="sm"
            onClick={addRecipient}
            width="full"
          >
            Add Recipient to Remove
          </Button>
        </VStack>
      </Box>

      <Alert variant="destructive">
        <AlertIcon />
        <AlertDescription>
          This operation will remove the specified recipients from the injector configuration
        </AlertDescription>
      </Alert>
    </VStack>
  );

  return (
    <Card>
      <CardHeader>
        <Heading size="md" fontWeight="semibold">
          Recipient Configuration
        </Heading>
      </CardHeader>
      <CardBody>
        {operation === "add" && renderAddOperation()}
        {operation === "remove" && renderRemoveOperation()}

        {config.recipients.some(recipient => !recipient) && (
          <Alert variant="destructive" mt={4}>
            <AlertIcon />
            <AlertDescription>All recipient addresses must be filled</AlertDescription>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
};

export default EditableInjectorConfigV2;
