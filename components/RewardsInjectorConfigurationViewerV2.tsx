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
} from "@chakra-ui/react";
import { InfoIcon, CopyIcon } from "@chakra-ui/icons";

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
  showCopyButtons?: boolean;
}

export const RewardsInjectorConfigurationViewerV2: React.FC<
  RewardsInjectorConfigurationViewerV2Props
> = ({ data, tokenSymbol, tokenDecimals, onCopyConfiguration, showCopyButtons = false }) => {
  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

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

  return (
    <Card variant="outline" width="full">
      <CardHeader>
        <Heading size="md">Current Gauge Configurations</Heading>
      </CardHeader>
      <CardBody>
        <VStack align="stretch">
          {!data || data.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>No current configuration</Text>
            </Alert>
          ) : (
            data.map((gauge, index) => (
              <Box key={gauge.gaugeAddress}>
                {index > 0 && <Divider my={4} />}
                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontWeight="medium" color={mutedTextColor}>
                        Recipient
                      </Text>
                      {showCopyButtons && onCopyConfiguration && (
                        <Tooltip label="Copy configuration to empty group or create new group">
                          <IconButton
                            aria-label="Copy configuration"
                            icon={<CopyIcon />}
                            size="md"
                            variant="ghost"
                            // colorScheme="blue"
                            onClick={() => handleCopyConfiguration(gauge)}
                          />
                        </Tooltip>
                      )}
                    </HStack>
                    <HStack
                      bg={bgColor}
                      p={4}
                      borderRadius="md"
                      justify="space-between"
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <VStack align="start" spacing={1}>
                        <Text fontFamily="mono">{gauge.gaugeAddress}</Text>
                        <Text fontSize="sm" color={mutedTextColor}>
                          {gauge.poolName}
                        </Text>
                      </VStack>

                      <Badge colorScheme={gauge.isRewardTokenSetup ? "green" : "yellow"}>
                        {gauge.isRewardTokenSetup ? "Active" : "Pending Setup"}
                      </Badge>
                    </HStack>
                  </Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                        Amount Per Period
                      </Text>
                      <Box
                        bg={bgColor}
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Text fontSize="lg" fontWeight="bold">
                          {gauge.amountPerPeriod} {tokenSymbol}
                        </Text>
                        <HStack spacing={2} mt={1} color={mutedTextColor}>
                          <Text fontSize="sm">Raw amount:</Text>
                          <Text fontSize="sm" fontFamily="mono">
                            {gauge.rawAmountPerPeriod}
                          </Text>
                          <Tooltip label={`Raw amount with ${tokenDecimals} decimals`}>
                            <Icon as={InfoIcon} />
                          </Tooltip>
                        </HStack>
                      </Box>
                    </Box>

                    <Box>
                      <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                        Periods
                      </Text>
                      <Box
                        bg={bgColor}
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Text fontSize="lg" fontWeight="bold">
                          {gauge.periodNumber} / {gauge.maxPeriods}
                        </Text>
                        <Text fontSize="sm" color={mutedTextColor} mt={1}>
                          Current / Maximum weekly periods
                        </Text>
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
                </VStack>
              </Box>
            ))
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};
