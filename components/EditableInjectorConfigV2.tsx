import React, { useState } from "react";
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
  useMediaQuery,
  Badge,
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
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const [config, setConfig] = useState<RecipientConfigData>(
    initialData || {
      recipients: [""],
      amountPerPeriod: "",
      maxPeriods: "",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    },
  );

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
        <Text className="font-medium mb-2">Recipients</Text>
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
                  <DeleteIcon className="h-4 w-4" />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button leftIcon={<AddIcon />} onClick={addRecipient} size="sm" variant="outline">
            Add Recipient
          </Button>
        </VStack>
      </Box>

      <Box>
        <Text className="font-medium mb-2">Amount Per Period ({tokenSymbol})</Text>
        <Input
          value={config.amountPerPeriod}
          onChange={e => handleInputChange("amountPerPeriod", e.target.value)}
          placeholder={`Enter amount in ${tokenSymbol}`}
        />
        <HStack className="mt-1">
          <Text className="text-sm text-gray-500">Raw amount:</Text>
          <Text className="text-sm text-gray-500">{config.rawAmountPerPeriod}</Text>
          <Tooltip title={`Raw amount with ${tokenDecimals} decimals`}>
            <InfoIcon color="gray.500" />
          </Tooltip>
        </HStack>
      </Box>

      <Box>
        <Text className="font-medium mb-2">Max Periods</Text>
        <Input
          type="number"
          value={config.maxPeriods}
          onChange={e => handleInputChange("maxPeriods", e.target.value)}
          placeholder="Number of weekly periods"
          min={1}
          max={255}
        />
      </Box>

      <Box>
        <Text className="font-medium mb-2">Do Not Start Before Timestamp</Text>
        <Tooltip title="Use 0 to start as soon as gauges are ready">
          <Input
            type="number"
            value={config.doNotStartBeforeTimestamp}
            onChange={e => handleInputChange("doNotStartBeforeTimestamp", e.target.value)}
            placeholder="Enter timestamp"
            min={0}
          />
        </Tooltip>
      </Box>
    </VStack>
  );

  const renderRemoveOperation = () => (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text className="font-medium mb-2">Recipients to Remove</Text>
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
                  <DeleteIcon className="h-4 w-4" />
                </IconButton>
              )}
            </HStack>
          ))}
          <Button
            variant="outline"
            leftIcon={<AddIcon />}
            size="sm"
            onClick={addRecipient}
            className="w-full"
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
        <div className="flex items-center justify-between">
          <Heading className="text-xl font-semibold">Recipient Configuration</Heading>
          <Badge variant={operation === "add" ? "default" : "destructive"}>
            {operation === "add" ? "Add Recipients" : "Remove Recipients"}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        {operation === "add" && renderAddOperation()}
        {operation === "remove" && renderRemoveOperation()}

        {config.recipients.some(recipient => !recipient) && (
          <Alert variant="destructive" className="mt-4">
            <AlertIcon />
            <AlertDescription>All recipient addresses must be filled</AlertDescription>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
};

export default EditableInjectorConfigV2;
