"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Container,
  Divider,
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
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  Badge,
  HStack,
  Tooltip,
  OrderedList,
  ListItem,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronDownIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import { AiOutlineClear } from "react-icons/ai";

import { AddressOption } from "@/types/interfaces";
import SimulateTransactionButton, {
  BatchFile,
  Transaction,
} from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import {
  copyJsonToClipboard,
  generateInjectorSchedulePayloadV2,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { networks } from "@/constants/constants";
import { formatTokenName } from "@/lib/utils/formatTokenName";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { getChainId } from "@/lib/utils/getChainId";
import { RewardsInjectorConfigurationViewerV2 } from "./RewardsInjectorConfigurationViewerV2";
import EditableInjectorConfigV2 from "./EditableInjectorConfigV2";
import { uuidv4 } from "@walletconnect/utils";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";
import { ConfigModeSwitcher, ConfigMode } from "@/components/ConfigModeSwitcher";

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
  id: string; // Added unique identifier for each config
  recipients: string[];
  amountPerPeriod: string;
  maxPeriods: string;
  doNotStartBeforeTimestamp: string;
  rawAmountPerPeriod: string;
}

// Create a type without id for interfacing with EditableInjectorConfigV2
type EditableRecipientConfigData = Omit<RecipientConfigData, "id">;

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
  // Changed to arrays of configurations
  const [addConfigs, setAddConfigs] = useState<RecipientConfigData[]>([
    {
      id: uuidv4(),
      recipients: [""],
      amountPerPeriod: "",
      maxPeriods: "",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    },
  ]);
  const [removeConfigs, setRemoveConfigs] = useState<RecipientConfigData[]>([
    {
      id: uuidv4(),
      recipients: [""],
      amountPerPeriod: "0",
      maxPeriods: "0",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    },
  ]);
  const [generatedPayload, setGeneratedPayload] = useState<BatchFile | null>(null);

  // Define Transaction type to fix TypeScript errors
  // Removed custom Transaction type in favor of imported one
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [operation, setOperation] = useState<ConfigMode | null>(null);

  useEffect(() => {
    if (selectedAddress && injectorData) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setTokenDecimals(injectorData.tokenInfo.decimals);
      setGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);
    }
  }, [selectedAddress, injectorData]);

  // Updated to handle config changes for multiple configs
  const handleConfigChange = (newConfig: EditableRecipientConfigData, configId: string) => {
    if (operation === ConfigMode.ADD) {
      setAddConfigs(prev =>
        prev.map(config => (config.id === configId ? { ...newConfig, id: configId } : config)),
      );
    } else if (operation === ConfigMode.REMOVE) {
      setRemoveConfigs(prev =>
        prev.map(config => (config.id === configId ? { ...newConfig, id: configId } : config)),
      );
    }
  };

  // Add a new config group
  const addConfigGroup = () => {
    const newConfig: RecipientConfigData = {
      id: uuidv4(),
      recipients: [""],
      amountPerPeriod: "",
      maxPeriods: "",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    };

    if (operation === ConfigMode.ADD) {
      setAddConfigs(prev => [...prev, newConfig]);
    } else if (operation === ConfigMode.REMOVE) {
      setRemoveConfigs(prev => [...prev, newConfig]);
    }
  };

  // Remove a config group
  const removeConfigGroup = (configId: string) => {
    if (operation === ConfigMode.ADD) {
      setAddConfigs(prev => prev.filter(config => config.id !== configId));
    } else if (operation === ConfigMode.REMOVE) {
      setRemoveConfigs(prev => prev.filter(config => config.id !== configId));
    }

    toast({
      title: "Configuration Deleted",
      description: "Configuration group has been removed.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Clear a config group (empty all fields but keep the group)
  const clearConfigGroup = (configId: string) => {
    const emptyData: EditableRecipientConfigData = {
      recipients: [""],
      amountPerPeriod: "",
      maxPeriods: "",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    };

    if (operation === ConfigMode.ADD) {
      setAddConfigs(prev =>
        prev.map(config => (config.id === configId ? { ...emptyData, id: configId } : config)),
      );
    } else if (operation === ConfigMode.REMOVE) {
      setRemoveConfigs(prev =>
        prev.map(config => (config.id === configId ? { ...emptyData, id: configId } : config)),
      );
    }

    toast({
      title: "Configuration Cleared",
      description: "All fields have been cleared for this configuration group.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
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

  // Updated to handle multiple config groups
  const calculateNewDistribution = (
    operation: ConfigMode | null,
    addConfigs: RecipientConfigData[],
    removeConfigs: RecipientConfigData[],
  ) => {
    const currentDist = calculateCurrentDistribution(gauges);
    let newTotal = currentDist.total;
    let newDistributed = currentDist.distributed;
    let newRemaining = currentDist.remaining;

    if (operation === ConfigMode.ADD) {
      addConfigs.forEach(config => {
        const amount = parseFloat(config.amountPerPeriod) || 0;
        const periods = parseInt(config.maxPeriods) || 0;
        const validRecipients = config.recipients.filter(r => r.trim()).length;

        const additionalTotal = amount * periods * validRecipients;
        newTotal += additionalTotal;
        newRemaining += additionalTotal;
      });
    } else if (operation === ConfigMode.REMOVE) {
      const removedAddresses: string[] = [];
      removeConfigs.forEach(config => {
        removedAddresses.push(...config.recipients.filter(r => r.trim()));
      });

      // Remove duplicates using Array.filter instead of Set
      const uniqueRemovedAddresses = removedAddresses.filter(
        (address, index, self) => self.indexOf(address) === index,
      );

      uniqueRemovedAddresses.forEach(address => {
        const gauge = gauges.find(g => g.gaugeAddress.toLowerCase() === address.toLowerCase());
        if (gauge) {
          const gaugeAmountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
          const gaugeMaxPeriods = parseInt(gauge.maxPeriods) || 0;
          const gaugePeriodNumber = parseInt(gauge.periodNumber) || 0;

          const gaugeTotal = gaugeAmountPerPeriod * gaugeMaxPeriods;
          const gaugeDistributed = gaugeAmountPerPeriod * gaugePeriodNumber;
          const gaugeRemaining = gaugeTotal - gaugeDistributed;

          newTotal -= gaugeTotal / 10 ** tokenDecimals;
          newDistributed -= gaugeDistributed / 10 ** tokenDecimals;
          newRemaining -= gaugeRemaining / 10 ** tokenDecimals;
        }
      });
    }

    return {
      total: newTotal,
      distributed: newDistributed,
      remaining: newRemaining,
    };
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentDistribution = calculateCurrentDistribution(gauges);
  const newDistribution = calculateNewDistribution(operation, addConfigs, removeConfigs);
  const distributionDelta = newDistribution.total - currentDistribution.total;

  // Check if any rewards are too small
  const MIN_REWARD_AMOUNT_WEI = 604800; // Minimum amount in wei

  const hasSmallRewards =
    operation === ConfigMode.ADD &&
    addConfigs.some(config => {
      const rawAmount = parseInt(config.rawAmountPerPeriod || "0");
      return rawAmount > 0 && rawAmount <= MIN_REWARD_AMOUNT_WEI;
    });

  // Convert min amount to human readable format for the warning
  const minHumanReadableAmount = tokenDecimals
    ? (MIN_REWARD_AMOUNT_WEI / 10 ** tokenDecimals).toFixed(Math.min(6, tokenDecimals))
    : "0.00";

  // Updated to generate multiple transactions in the payload
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

    // Check for too small rewards before generating the payload
    if (hasSmallRewards) {
      toast({
        title: "Rewards Too Small",
        description: `One or more reward amounts are too small (≤ ${minHumanReadableAmount} ${tokenSymbol}). The gauge cannot handle rewards this small.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      // Allow generation to continue despite the warning
    }

    try {
      const chainId = Number(getChainId(selectedAddress.network));
      let transactions: Transaction[] = [];

      if (operation === ConfigMode.ADD) {
        // Generate a transaction for each add config
        for (const config of addConfigs) {
          // Skip empty configurations
          if (
            !config.recipients.some(r => r.trim()) ||
            !config.rawAmountPerPeriod ||
            !config.maxPeriods
          ) {
            continue;
          }

          const validRecipients = config.recipients.filter(r => r.trim());
          if (validRecipients.length === 0) continue;

          const addPayload = generateInjectorSchedulePayloadV2({
            injectorAddress: selectedAddress.address,
            chainId: chainId,
            safeAddress: selectedSafe,
            operation: "add",
            scheduleInputs: validRecipients.map(recipient => ({
              gaugeAddress: recipient,
              rawAmountPerPeriod: config.rawAmountPerPeriod,
              maxPeriods: config.maxPeriods,
              doNotStartBeforeTimestamp: config.doNotStartBeforeTimestamp,
            })),
          });

          transactions.push(addPayload.transactions[0]);
        }
      } else if (operation === ConfigMode.REMOVE) {
        // Generate a transaction for each remove config
        for (const config of removeConfigs) {
          const validRecipients = config.recipients.filter(r => r.trim());
          if (validRecipients.length === 0) continue;

          const removePayload = generateInjectorSchedulePayloadV2({
            injectorAddress: selectedAddress.address,
            chainId: chainId,
            safeAddress: selectedSafe,
            operation: "remove",
            scheduleInputs: validRecipients.map(recipient => ({
              gaugeAddress: recipient,
            })),
          });

          transactions.push(removePayload.transactions[0]);
        }
      }

      if (transactions.length === 0) {
        toast({
          title: "No valid configurations",
          description: "Please add at least one valid configuration with recipients.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Create the final payload with all transactions
      const finalPayload: BatchFile = {
        version: "1.0",
        chainId: chainId.toString(),
        createdAt: Math.floor(Date.now() / 1000),
        meta: {
          name: `Rewards Injector Schedule - ${operation?.toUpperCase()}`,
          description: `Configure rewards injector schedule to ${operation} recipients`,
          createdFromSafeAddress: selectedSafe,
        },
        transactions: transactions,
      };

      setGeneratedPayload(finalPayload);
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
    if (typeof newJson === "string") {
      try {
        const parsed = JSON.parse(newJson);
        setGeneratedPayload(parsed as BatchFile);
      } catch (err) {
        toast({
          title: "Invalid JSON",
          description: "Could not parse the modified JSON",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      setGeneratedPayload(newJson);
    }
  };

  const getPrefillValues = useCallback(() => {
    // Make sure we have a selected injector and an operation type
    if (!selectedAddress || !operation)
      return {
        prefillBranchName: "",
        prefillPrName: "",
        prefillDescription: "",
        prefillFilename: "",
      };

    // Generate a unique ID for the branch and file
    const uniqueId = generateUniqueId();

    // Get injector details for the filename and description
    const shortInjectorId = selectedAddress.address.substring(0, 8);
    const networkName = selectedAddress.network;

    // Count total recipients and calculate total allocation
    let totalValidRecipients = 0;
    let totalAmount = 0;

    if (operation === ConfigMode.ADD) {
      addConfigs.forEach(config => {
        const validRecipients = config.recipients.filter(r => r.trim()).length;
        totalValidRecipients += validRecipients;

        const amountPerPeriod = parseFloat(config.amountPerPeriod) || 0;
        const maxPeriods = parseInt(config.maxPeriods) || 0;
        totalAmount += amountPerPeriod * maxPeriods * validRecipients;
      });
    } else {
      // For remove, just count recipients
      removeConfigs.forEach(config => {
        totalValidRecipients += config.recipients.filter(r => r.trim()).length;
      });
    }

    // Get summary info for PR description
    let summaryInfo = "";
    if (operation === ConfigMode.ADD) {
      summaryInfo = `adding ${totalValidRecipients} recipient${totalValidRecipients !== 1 ? "s" : ""} with total allocation of ${formatAmount(totalAmount)} ${tokenSymbol}`;
    } else {
      summaryInfo = `removing ${totalValidRecipients} recipient${totalValidRecipients !== 1 ? "s" : ""}`;
    }

    // Create the filename without any path prefix - the path will come from config
    const filename = `injector-${operation}-recipients-${shortInjectorId}-${uniqueId}.json`;

    return {
      prefillBranchName: `feature/injector-${operation}-${shortInjectorId}-${uniqueId}`,
      prefillPrName: `${operation === ConfigMode.ADD ? "Add" : "Remove"} Recipients for ${tokenSymbol} Injector on ${networkName}`,
      prefillDescription: `This PR updates the rewards injector at ${selectedAddress.address} by ${summaryInfo} on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [selectedAddress, operation, addConfigs, removeConfigs, tokenSymbol, formatAmount]);

  // Handle copying configuration from existing gauge
  const handleCopyConfiguration = (config: {
    gaugeAddress: string;
    amountPerPeriod: string;
    rawAmountPerPeriod: string;
    maxPeriods: string;
    doNotStartBeforeTimestamp: string;
  }) => {
    if (operation !== ConfigMode.ADD) {
      toast({
        title: "Copy Not Available",
        description: "Configuration copying is only available when adding recipients.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Find the first empty configuration group or create a new one
    const emptyConfigIndex = addConfigs.findIndex(
      configGroup =>
        !configGroup.recipients.some(r => r.trim()) &&
        !configGroup.amountPerPeriod &&
        !configGroup.maxPeriods,
    );

    if (emptyConfigIndex !== -1) {
      // Copy to the first empty configuration group
      const updatedConfig = {
        ...addConfigs[emptyConfigIndex],
        recipients: [config.gaugeAddress],
        amountPerPeriod: config.amountPerPeriod,
        rawAmountPerPeriod: config.rawAmountPerPeriod,
        maxPeriods: config.maxPeriods,
        doNotStartBeforeTimestamp: config.doNotStartBeforeTimestamp,
      };

      setAddConfigs(prev =>
        prev.map((c, index) => (index === emptyConfigIndex ? updatedConfig : c)),
      );

      toast({
        title: "Configuration Copied",
        description: `Copied to Configuration Group ${emptyConfigIndex + 1}: ${config.gaugeAddress} with ${config.amountPerPeriod} ${tokenSymbol} per period for ${config.maxPeriods} periods.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } else {
      // All groups have data, create a new configuration group
      const newConfig = {
        id: uuidv4(),
        recipients: [config.gaugeAddress],
        amountPerPeriod: config.amountPerPeriod,
        rawAmountPerPeriod: config.rawAmountPerPeriod,
        maxPeriods: config.maxPeriods,
        doNotStartBeforeTimestamp: config.doNotStartBeforeTimestamp,
      };

      setAddConfigs(prev => [...prev, newConfig]);

      toast({
        title: "Configuration Copied",
        description: `Created new Configuration Group ${addConfigs.length + 1}: ${config.gaugeAddress} with ${config.amountPerPeriod} ${tokenSymbol} per period for ${config.maxPeriods} periods.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle copying all configurations at once
  const handleCopyAllConfigurations = () => {
    if (operation !== ConfigMode.ADD) {
      toast({
        title: "Copy Not Available",
        description: "Configuration copying is only available when adding recipients.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!gauges || gauges.length === 0) {
      toast({
        title: "No Configurations to Copy",
        description: "There are no existing gauge configurations to copy.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Clear existing configurations and create new ones for each gauge
    const newConfigs: RecipientConfigData[] = gauges.map(gauge => ({
      id: uuidv4(),
      recipients: [gauge.gaugeAddress],
      amountPerPeriod: gauge.amountPerPeriod,
      rawAmountPerPeriod: gauge.rawAmountPerPeriod,
      maxPeriods: gauge.maxPeriods,
      // when copying all configurations, don't set the doNotStartBeforeTimestamp
      doNotStartBeforeTimestamp: "",
    }));

    setAddConfigs(newConfigs);

    toast({
      title: "All Configurations Copied",
      description: `Copied ${gauges.length} gauge configurations. Each gauge has been placed in its own configuration group.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Injector Schedule Payload Configurator
        </Heading>
        <Text mb={6}>
          Build a injector schedule payload to configure reward emissions on a gauge set.
        </Text>
      </Box>
      <Flex justifyContent="space-between" alignItems="center" verticalAlign="center" mb={4}>
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
          <MenuList w="135%" maxHeight="60vh" overflowY="auto">
            {addresses.map(address => (
              <MenuItem
                key={`${address.network}-${address.address}-${uuidv4()}`}
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
            aria-label={"View on explorer"}
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

        <FormControl display="flex" alignItems="center" w="auto" marginLeft={10}>
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
                Additional {formatAmount(distributionDelta - contractBalance)} {tokenSymbol}{" "}
                required to complete all distributions.
              </AlertDescription>
            </Alert>
          )}

          {hasSmallRewards && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <AlertTitle mr={2}>Rewards Too Small!</AlertTitle>
              <AlertDescription>
                One or more reward amounts are too small (≤ {MIN_REWARD_AMOUNT_WEI} WEI or{" "}
                {minHumanReadableAmount} {tokenSymbol}). The gauge cannot handle rewards this small.
                Please increase the reward amount to be at least 1 WEI / second.
              </AlertDescription>
            </Alert>
          )}

          <Box mt={6}>
            <Heading as="h3" size="md" mb={4}>
              Choose Operation
            </Heading>
            <ConfigModeSwitcher configMode={operation} onChange={setOperation} />
            {!operation && (
              <Alert status="info" mt={4}>
                <AlertIcon />
                <AlertDescription>
                  Select an operation above to get started. Choose "Add Recipients" to copy from
                  existing configurations or create new ones.
                </AlertDescription>
              </Alert>
            )}
            {operation === ConfigMode.ADD && gauges && gauges.length > 0 && (
              <Alert status="info" mt={4}>
                <Box flex="1">
                  <Flex align={"center"}>
                    <AlertIcon />
                    <AlertTitle> Next steps:</AlertTitle>
                  </Flex>

                  <AlertDescription>
                    <OrderedList spacing={2} mt={2}>
                      <ListItem>
                        Copy existing configurations using the buttons below (optional)
                      </ListItem>
                      <ListItem>Add them to your configuration groups</ListItem>
                      <ListItem>Generate payload when ready</ListItem>
                    </OrderedList>
                  </AlertDescription>
                </Box>
              </Alert>
            )}
            {operation === ConfigMode.REMOVE && (
              <Alert status="warning" mt={4}>
                <Box flex="1">
                  <Flex align={"center"}>
                    <AlertIcon />
                    <AlertTitle> Next steps:</AlertTitle>
                  </Flex>

                  <AlertDescription>
                    <OrderedList spacing={2} mt={2}>
                      <ListItem>
                        Select recipient addresses from the current configuration below
                      </ListItem>
                      <ListItem>Add them to your configuration group</ListItem>
                      <ListItem>Generate payload when ready</ListItem>
                    </OrderedList>
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>

          <Box mt={6}>
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
              <Heading as="h2" size="lg">
                Current Configuration
              </Heading>
              <HStack spacing={2}>
                {gauges && gauges.length > 0 && (
                  <>
                    <Button
                      leftIcon={<CopyIcon />}
                      onClick={handleCopyAllConfigurations}
                      size="sm"
                      variant="outline"
                      isDisabled={operation !== "add"}
                    >
                      Copy all
                    </Button>
                    {operation === "remove" && (
                      <Text fontSize="sm" color="gray.500">
                        Copy not available for remove operations
                      </Text>
                    )}
                    {!operation && (
                      <Text fontSize="sm" color="gray.500">
                        Select "Add Recipients" to enable copying
                      </Text>
                    )}
                  </>
                )}
              </HStack>
            </Flex>

            <RewardsInjectorConfigurationViewerV2
              data={gauges}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
              onCopyConfiguration={handleCopyConfiguration}
              showCopyButtons={operation === ConfigMode.ADD}
            />
          </Box>

          {operation && (
            <Box mt={6}>
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading as="h3" size="md">
                  {operation === ConfigMode.ADD
                    ? "Add Recipients Configuration"
                    : "Remove Recipients Configuration"}
                </Heading>
                <Button variant="outline" leftIcon={<AddIcon />} onClick={addConfigGroup} size="sm">
                  Add Configuration Group
                </Button>
              </Flex>

              {(operation === ConfigMode.ADD ? addConfigs : removeConfigs).map((config, index) => {
                // Check if this configuration group is empty
                const isEmpty =
                  operation === ConfigMode.ADD &&
                  !config.recipients.some(r => r.trim()) &&
                  !config.amountPerPeriod &&
                  !config.maxPeriods;

                return (
                  <Box
                    key={config.id}
                    p={4}
                    mb={4}
                    borderWidth="1px"
                    borderRadius="md"
                    position="relative"
                    borderColor="gray.200"
                    _dark={{
                      borderColor: "gray.600",
                    }}
                  >
                    <Flex justifyContent="space-between" alignItems="center" mb={3}>
                      <HStack spacing={2}>
                        <Heading as="h4" size="sm">
                          Configuration Group {index + 1}
                        </Heading>
                        {isEmpty && (
                          <Badge colorScheme="gray" variant="subtle" size="sm">
                            Empty
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing={2}>
                        <Tooltip label="Clear all fields in this group">
                          <IconButton
                            aria-label="Clear configuration"
                            icon={<AiOutlineClear />}
                            size="md"
                            onClick={() => clearConfigGroup(config.id)}
                            colorScheme="gray"
                            variant="ghost"
                          />
                        </Tooltip>
                        {(operation === ConfigMode.ADD ? addConfigs.length : removeConfigs.length) >
                          1 && (
                          <Tooltip label="Delete this configuration group">
                            <IconButton
                              aria-label="Delete configuration"
                              icon={<DeleteIcon />}
                              size="sm"
                              onClick={() => removeConfigGroup(config.id)}
                              colorScheme="red"
                              variant="ghost"
                            />
                          </Tooltip>
                        )}
                      </HStack>
                    </Flex>

                    <EditableInjectorConfigV2
                      initialData={{
                        recipients: config.recipients,
                        amountPerPeriod: config.amountPerPeriod,
                        maxPeriods: config.maxPeriods,
                        doNotStartBeforeTimestamp: config.doNotStartBeforeTimestamp,
                        rawAmountPerPeriod: config.rawAmountPerPeriod,
                      }}
                      tokenSymbol={tokenSymbol}
                      tokenDecimals={tokenDecimals}
                      operation={operation}
                      onConfigChange={newConfig => handleConfigChange(newConfig, config.id)}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}

      {isLoading && (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {selectedAddress && !isLoading && operation && (
        <Flex justifyContent="space-between" mt={6} mb={6}>
          <Button variant="primary" onClick={generatePayload}>
            Generate Payload
          </Button>
          {generatedPayload && <SimulateTransactionButton batchFile={generatedPayload} />}
        </Flex>
      )}
      <Divider />

      {generatedPayload && (
        <JsonViewerEditor jsonData={generatedPayload} onJsonChange={handleJsonChange} />
      )}

      {generatedPayload && (
        <Box display="flex" alignItems="center" mt="20px">
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<DownloadIcon />}
            onClick={() => handleDownloadClick(JSON.stringify(generatedPayload))}
          >
            Download Payload
          </Button>
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<CopyIcon />}
            onClick={() => copyJsonToClipboard(JSON.stringify(generatedPayload), toast)}
          >
            Copy Payload to Clipboard
          </Button>
          <OpenPRButton onClick={handleOpenPRModal} />
          <Box mt={8} />
          <PRCreationModal
            type={"injector-configurator"}
            isOpen={isOpen}
            onClose={onClose}
            payload={generatedPayload ? JSON.parse(JSON.stringify(generatedPayload)) : null}
            network={selectedAddress ? selectedAddress.network.toLowerCase() : "mainnet"}
            {...getPrefillValues()}
          />
        </Box>
      )}
    </Container>
  );
}

export default RewardsInjectorConfiguratorV2;
