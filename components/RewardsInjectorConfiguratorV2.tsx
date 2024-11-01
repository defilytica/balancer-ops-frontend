"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";

import { AddressOption } from "@/types/interfaces";
import SimulateTransactionButton, {
  BatchFile,
} from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import {
  copyJsonToClipboard,
  generateInjectorSchedulePayload,
  generateInjectorSchedulePayloadV2,
  handleDownloadClick,
  InjectorScheduleInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { networks } from "@/constants/constants";
import { formatTokenName } from "@/lib/utils/formatTokenName";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { getChainId } from "@/lib/utils/getChainId";
import { RewardsInjectorConfigurationViewerV2 } from "./RewardsInjectorConfigurationViewerV2";
import EditableInjectorConfigV2 from "./EditableInjectorConfigV2";

type RewardsInjectorConfiguratorV2Props = {
  addresses: AddressOption[];
  selectedAddress: AddressOption | null;
  onAddressSelect: (address: AddressOption) => void;
  selectedSafe: string;
  injectorData: any;
  isLoading: boolean;
  onVersionToggle: () => void;
  isV2: boolean;
};

interface RecipientConfigData {
  recipients: string[];
  amountPerPeriod: string;
  maxPeriods: string;
  doNotStartBeforeTimestamp: string;
  rawAmountPerPeriod: string;
}

function RewardsInjectorConfiguratorV2({
  addresses,
  selectedAddress,
  onAddressSelect,
  selectedSafe,
  injectorData,
  isLoading,
  isV2,
  onVersionToggle,
}: RewardsInjectorConfiguratorV2Props) {
  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(0);
  const [addConfig, setAddConfig] = useState<RecipientConfigData>({
    recipients: [""],
    amountPerPeriod: "",
    maxPeriods: "",
    doNotStartBeforeTimestamp: "0",
    rawAmountPerPeriod: "0",
  });
  const [removeConfig, setRemoveConfig] = useState<RecipientConfigData>({
    recipients: [""],
    amountPerPeriod: "0",
    maxPeriods: "0",
    doNotStartBeforeTimestamp: "0",
    rawAmountPerPeriod: "0",
  });
  const [generatedPayload, setGeneratedPayload] = useState<BatchFile | null>(
    null,
  );
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [operation, setOperation] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    if (selectedAddress && injectorData) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setTokenDecimals(injectorData.tokenInfo.symbol === "USDC" ? 6 : 18);
      setGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);
    }
  }, [selectedAddress, injectorData]);

  const handleConfigChange = (newConfig: RecipientConfigData) => {
    if (operation === "add") {
      setAddConfig(newConfig);
    } else if (operation === "remove") {
      setRemoveConfig(newConfig);
    }
  };

  const calculateCurrentDistribution = (gauges: RewardsInjectorData[]) => {
    const distribution = gauges.reduce(
      (acc, gauge) => {
        const amountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
        const maxPeriods = parseInt(gauge.maxPeriods) || 0;
        const periodNumber = parseInt(gauge.periodNumber) || 0;

        const gaugeTotal = amountPerPeriod * maxPeriods;
        const gaugeDistributed = amountPerPeriod * periodNumber;
        const gaugeRemaining = gaugeTotal - gaugeDistributed;

        return {
          total: acc.total + gaugeTotal,
          distributed: acc.distributed + gaugeDistributed,
          remaining: acc.remaining + gaugeRemaining,
        };
      },
      {
        total: 0,
        distributed: 0,
        remaining: 0,
      },
    );

    return distribution;
  };

  const calculateNewDistribution = (
    operation: "add" | "remove" | null,
    addConfig: RecipientConfigData,
    removeConfig: RecipientConfigData,
  ) => {
    const currentDist = calculateCurrentDistribution(gauges);
    let newTotal = currentDist.total;
    let newDistributed = currentDist.distributed;
    let newRemaining = currentDist.remaining;

    if (operation === "add") {
      const amount = parseFloat(addConfig.amountPerPeriod) || 0;
      const periods = parseInt(addConfig.maxPeriods) || 0;
      const validRecipients = addConfig.recipients.filter((r) =>
        r.trim(),
      ).length;

      const additionalTotal = amount * periods * validRecipients;
      newTotal += additionalTotal;
      newRemaining += additionalTotal;
    } else if (operation === "remove") {
      const removedAddresses = removeConfig.recipients.filter((r) => r.trim());

      removedAddresses.forEach((address) => {
        const gauge = gauges.find(
          (g) => g.gaugeAddress.toLowerCase() === address.toLowerCase(),
        );
        if (gauge) {
          const gaugeAmountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
          const gaugeMaxPeriods = parseInt(gauge.maxPeriods) || 0;
          const gaugePeriodNumber = parseInt(gauge.periodNumber) || 0;

          const gaugeTotal = gaugeAmountPerPeriod * gaugeMaxPeriods;
          const gaugeDistributed = gaugeAmountPerPeriod * gaugePeriodNumber;
          const gaugeRemaining = gaugeTotal - gaugeDistributed;

          newTotal -= gaugeTotal;
          newDistributed -= gaugeDistributed;
          newRemaining -= gaugeRemaining;
        }
      });
    }

    return {
      total: newTotal,
      distributed: newDistributed,
      remaining: newRemaining,
    };
  };

  const calculateDistributionAmounts = (addConfig: RecipientConfigData) => {
    if (!addConfig.amountPerPeriod || !addConfig.maxPeriods) {
      return { total: 0, distributed: 0, remaining: 0 };
    }

    const amount = parseFloat(addConfig.amountPerPeriod) || 0;
    const maxPeriods = parseInt(addConfig.maxPeriods) || 0;
    const totalRecipients = addConfig.recipients.filter((r) => r.trim()).length;

    const total = amount * maxPeriods * totalRecipients;
    return { total, distributed: 0, remaining: total };
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentDistribution = calculateCurrentDistribution(gauges);
  const newDistribution = calculateNewDistribution(
    operation,
    addConfig,
    removeConfig,
  );
  const distributionDelta = newDistribution.total - currentDistribution.total;

  const generatePayload = () => {
    if (!selectedAddress) {
      toast({
        title: "Invalid Input",
        description: "Please select an injector.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const payload = generateInjectorSchedulePayloadV2({
        injectorAddress: selectedAddress.address,
        chainId: Number(getChainId(selectedAddress.network)),
        safeAddress: selectedSafe,
        operation: operation || "add",
        scheduleInputs:
          operation === "add"
            ? addConfig.recipients.map((recipient) => ({
                gaugeAddress: recipient,
                rawAmountPerPeriod: addConfig.rawAmountPerPeriod,
                maxPeriods: addConfig.maxPeriods,
                doNotStartBeforeTimestamp: addConfig.doNotStartBeforeTimestamp,
              }))
            : removeConfig.recipients.map((recipient) => ({
                gaugeAddress: recipient,
              })),
      });

      setGeneratedPayload(payload);
    } catch (error) {
      toast({
        title: "Error Generating Payload",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleOpenPRModal = () => {
    if (generatedPayload) {
      onOpen();
    } else {
      toast({
        title: "No payload generated",
        description: "Please generate a payload first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleJsonChange = (newJson: string | BatchFile) => {
    setGeneratedPayload(newJson as BatchFile);
  };

  return (
    <Container maxW="container.xl">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Injector Schedule Payload Configurator
        </Heading>
        <Text mb={6}>
          Build a injector schedule payload to configure reward emissions on a
          gauge set.
        </Text>
      </Box>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        verticalAlign="center"
        mb={4}
      >
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            isDisabled={isLoading}
            whiteSpace="normal"
            height="auto"
            blockSize="auto"
            w="100%"
          >
            {selectedAddress ? (
              <Flex alignItems="center">
                <Image
                  src={networks[selectedAddress.network]?.logo}
                  alt={`${selectedAddress.network} logo`}
                  boxSize="20px"
                  mr={2}
                />
                <Text>
                  <Text as="span" fontFamily="mono" isTruncated>
                    {isMobile
                      ? `${selectedAddress.address.slice(0, 6)}...`
                      : selectedAddress.address}
                  </Text>
                  {" - "}
                  {formatTokenName(selectedAddress.token)}
                </Text>
              </Flex>
            ) : (
              <Text>Select an injector</Text>
            )}
          </MenuButton>
          <MenuList w="135%">
            {addresses.map((address) => (
              <MenuItem
                key={address.network + address.token}
                onClick={() => onAddressSelect(address)}
                w="100%"
              >
                <Flex alignItems="center" w="100%">
                  <Image
                    src={networks[address.network]?.logo}
                    alt={`${address.network} logo`}
                    boxSize="20px"
                    mr={2}
                  />
                  <Text>
                    <Text as="span" fontFamily="mono" isTruncated>
                      {address.address}
                    </Text>
                    {" - "}
                    {formatTokenName(address.token)}
                  </Text>
                </Flex>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {selectedAddress && (
          <IconButton
            aria-label={""}
            as="a"
            href={`${networks[selectedAddress.network.toLowerCase()].explorer}address/${selectedAddress.address}`}
            target="_blank"
            rel="noopener noreferrer"
            size="m"
            icon={<ExternalLinkIcon />}
            variant="ghost"
            ml={2}
          />
        )}

        <FormControl
          display="flex"
          alignItems="center"
          w="auto"
          marginLeft={10}
        >
          <FormLabel htmlFor="version-switch" mb="0">
            V1
          </FormLabel>
          <Switch
            size={"lg"}
            id="version-switch"
            isChecked={isV2}
            onChange={() => {
              setGauges([]);
              onVersionToggle();
            }}
          />
          <FormLabel htmlFor="version-switch" mb="0" ml={2}>
            V2
          </FormLabel>
        </FormControl>
      </Flex>

      {selectedAddress && !isLoading && (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Current Total Distribution</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(currentDistribution.total)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">New Total Distribution</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(newDistribution.total)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Distribution Delta</Heading>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={distributionDelta >= 0 ? "green.500" : "red.500"}
                  >
                    {distributionDelta >= 0 ? "+" : ""}
                    {formatAmount(distributionDelta)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {distributionDelta > contractBalance && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle mr={2}>Insufficient Funds!</AlertTitle>
              <AlertDescription>
                Additional {formatAmount(distributionDelta - contractBalance)}{" "}
                {tokenSymbol} required to complete all distributions.
              </AlertDescription>
            </Alert>
          )}

          <Box mt={6}>
            <Heading as="h2" size="lg" mb={4}>
              Current Configuration
            </Heading>
            <RewardsInjectorConfigurationViewerV2
              data={gauges}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
            />
          </Box>
          <Box mt={6} gap={4}>
            <Button onClick={() => setOperation("add")} mr={4}>
              Add Recipients
            </Button>
            <Button onClick={() => setOperation("remove")}>
              Remove Recipients
            </Button>
          </Box>
          <Box mt={6}>
            <EditableInjectorConfigV2
              initialData={operation === "add" ? addConfig : removeConfig}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
              operation={operation}
              onConfigChange={handleConfigChange}
            />
          </Box>
        </>
      )}

      {isLoading && (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {selectedAddress && !isLoading && (
        <Flex justifyContent="space-between" mt={6} mb={6}>
          <Button colorScheme="blue" onClick={generatePayload}>
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={generatedPayload} />
          )}
        </Flex>
      )}
      <Divider />

      {generatedPayload && (
        <JsonViewerEditor
          jsonData={generatedPayload}
          onJsonChange={handleJsonChange}
        />
      )}

      {generatedPayload && (
        <Box display="flex" alignItems="center" mt="20px">
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<DownloadIcon />}
            onClick={() =>
              handleDownloadClick(JSON.stringify(generatedPayload))
            }
          >
            Download Payload
          </Button>
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<CopyIcon />}
            onClick={() =>
              copyJsonToClipboard(JSON.stringify(generatedPayload), toast)
            }
          >
            Copy Payload to Clipboard
          </Button>
          <OpenPRButton onClick={handleOpenPRModal} />
          <Box mt={8} />
          <PRCreationModal
            type={"injector-configurator"}
            isOpen={isOpen}
            onClose={onClose}
            payload={
              generatedPayload
                ? JSON.parse(JSON.stringify(generatedPayload))
                : null
            }
          />
        </Box>
      )}
    </Container>
  );
}

export default RewardsInjectorConfiguratorV2;
