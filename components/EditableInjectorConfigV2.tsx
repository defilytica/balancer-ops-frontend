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
  isDisabled?: boolean;
}

const EditableInjectorConfigV2: React.FC<EditableInjectorConfigV2Props> = ({
  initialData,
  tokenSymbol,
  tokenDecimals,
  onConfigChange,
  operation,
  isDisabled = false,
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

  // Helper function to convert UTC timestamp to local datetime string for datetime-local input
  const convertTimestampToLocalDateTime = (timestamp: string): string => {
    if (!timestamp || timestamp === "0") return "";
    const date = new Date(parseInt(timestamp) * 1000);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper function to get minimum datetime (current time) for datetime-local input
  const getMinDateTime = () => {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localNow.toISOString().slice(0, 16);
  };

  // Update local state when initialData changes (for copy configuration functionality)
  useEffect(() => {
    if (initialData) {
      setConfig(initialData);
      const localDateTime = convertTimestampToLocalDateTime(initialData.doNotStartBeforeTimestamp);
      setDoNotStartBeforeDateTime(localDateTime);
    }
  }, [initialData]);

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

  // Unified helper to update config and notify parent
  const updateConfig = (newConfig: RecipientConfigData) => {
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...config.recipients];
    newRecipients[index] = value;
    updateConfig({ ...config, recipients: newRecipients });
  };

  const handleInputChange = (field: keyof RecipientConfigData, value: string) => {
    const newConfig = { ...config };
    if (field === "amountPerPeriod") {
      newConfig.amountPerPeriod = value;
      newConfig.rawAmountPerPeriod = convertToRawAmount(value);
    } else if (field === "recipients") {
      // This shouldn't happen as recipients are handled separately
      console.warn("Recipients should be handled via handleRecipientChange");
    } else {
      // Handle string fields: maxPeriods, doNotStartBeforeTimestamp, rawAmountPerPeriod
      (newConfig[field] as string) = value;
    }
    updateConfig(newConfig);
  };

  const handleDateTimeChange = (dateTimeString: string) => {
    setDoNotStartBeforeDateTime(dateTimeString);
    updateConfig({
      ...config,
      doNotStartBeforeTimestamp: convertDateTimeToTimestamp(dateTimeString),
    });
  };

  const addRecipient = () => {
    updateConfig({
      ...config,
      recipients: [...config.recipients, ""],
    });
  };

  const removeRecipient = (index: number) => {
    updateConfig({
      ...config,
      recipients: config.recipients.filter((_, i) => i !== index),
    });
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
                isDisabled={isDisabled}
              />
              {config.recipients.length > 1 && (
                <IconButton
                  aria-label="Delete recipient"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecipient(index)}
                  isDisabled={isDisabled}
                >
                  <DeleteIcon boxSize={4} />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button
            leftIcon={<AddIcon />}
            onClick={addRecipient}
            size="sm"
            variant="outline"
            isDisabled={isDisabled}
          >
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
            isDisabled={isDisabled}
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
            isDisabled={isDisabled}
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
          isDisabled={isDisabled}
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
                isDisabled={isDisabled}
              />
              {config.recipients.length > 1 && (
                <IconButton
                  aria-label="Delete recipient"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecipient(index)}
                  isDisabled={isDisabled}
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
            isDisabled={isDisabled}
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
          {operation === "add" ? "Add Recipient" : "Remove Recipient"}
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
