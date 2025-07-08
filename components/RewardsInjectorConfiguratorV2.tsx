"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
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
  Switch,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  Badge,
  HStack,
  Tooltip,
  VStack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
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
import { GAUGE_MIN_REWARD_AMOUNT_WEI, networks } from "@/constants/constants";
import { formatTokenName } from "@/lib/utils/formatTokenName";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { getChainId } from "@/lib/utils/getChainId";
import { RewardsInjectorConfigurationViewerV2 } from "./RewardsInjectorConfigurationViewerV2";
import EditableInjectorConfigV2 from "./EditableInjectorConfigV2";
import { uuidv4 } from "@walletconnect/utils";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";

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
  id: string;
  recipients: string[];
  amountPerPeriod: string;
  maxPeriods: string;
  doNotStartBeforeTimestamp: string;
  rawAmountPerPeriod: string;
}

type EditableRecipientConfigData = Omit<RecipientConfigData, "id">;

interface EditingConfigState {
  id: string;
  data: EditableRecipientConfigData;
}

// Helper functions extracted from the component
const createEmptyConfig = (operationType: "add" | "remove" = "add"): RecipientConfigData => ({
  id: uuidv4(),
  recipients: [""],
  amountPerPeriod: operationType === "add" ? "" : "0",
  maxPeriods: operationType === "add" ? "" : "0",
  doNotStartBeforeTimestamp: "0",
  rawAmountPerPeriod: "0",
});

const formatAmount = (amount: number) => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const calculateDistribution = (gauges: RewardsInjectorData[]) => {
  return gauges.reduce(
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
    { total: 0, distributed: 0, remaining: 0 },
  );
};

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
  const [addConfigs, setAddConfigs] = useState<RecipientConfigData[]>([]);
  const [removeConfigs, setRemoveConfigs] = useState<RecipientConfigData[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<BatchFile | null>(null);
  const [editingConfig, setEditingConfig] = useState<EditingConfigState | null>(null);
  const [editedConfigs, setEditedConfigs] = useState<Map<string, EditableRecipientConfigData>>(
    new Map(),
  );

  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const successColor = useColorModeValue("green.500", "green.300");
  const errorColor = useColorModeValue("red.500", "red.300");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    if (selectedAddress && injectorData) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setTokenDecimals(injectorData.tokenInfo.decimals);
      setGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);
    }
  }, [selectedAddress, injectorData]);

  // Handle config changes
  const handleAddConfigChange = (newConfig: EditableRecipientConfigData, configId: string) => {
    setAddConfigs(prev =>
      prev.map(config => (config.id === configId ? { ...newConfig, id: configId } : config)),
    );
  };

  const handleRemoveConfigChange = (newConfig: EditableRecipientConfigData, configId: string) => {
    setRemoveConfigs(prev =>
      prev.map(config => (config.id === configId ? { ...newConfig, id: configId } : config)),
    );
  };

  // Add config operations
  const addAddConfigGroup = () => {
    const newConfig = createEmptyConfig("add");
    setAddConfigs(prev => [...prev, newConfig]);
  };

  const removeAddConfigGroup = (configId: string) => {
    const newConfigs = addConfigs.filter(config => config.id !== configId);
    setAddConfigs(newConfigs);

    const message =
      newConfigs.length === 0
        ? "Add Recipients section has been hidden (no configuration groups remaining)."
        : "Add configuration group has been removed.";

    toast({
      title: "Configuration Deleted",
      description: message,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const clearAddConfigGroup = (configId: string) => {
    const emptyData: EditableRecipientConfigData = {
      recipients: [""],
      amountPerPeriod: "",
      maxPeriods: "",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    };

    setAddConfigs(prev =>
      prev.map(config => (config.id === configId ? { ...emptyData, id: configId } : config)),
    );

    toast({
      title: "Configuration Cleared",
      description: "All fields have been cleared for this configuration group.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Remove config operations
  const addRemoveConfigGroup = () => {
    const newConfig = createEmptyConfig("remove");
    setRemoveConfigs(prev => [...prev, newConfig]);
  };

  const removeRemoveConfigGroup = (configId: string) => {
    const newConfigs = removeConfigs.filter(config => config.id !== configId);
    setRemoveConfigs(newConfigs);

    const message =
      newConfigs.length === 0
        ? "Remove Recipients section has been hidden (no configuration groups remaining)."
        : "Remove configuration group has been removed.";

    toast({
      title: "Configuration Deleted",
      description: message,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const clearRemoveConfigGroup = (configId: string) => {
    const emptyData: EditableRecipientConfigData = {
      recipients: [""],
      amountPerPeriod: "0",
      maxPeriods: "0",
      doNotStartBeforeTimestamp: "0",
      rawAmountPerPeriod: "0",
    };

    setRemoveConfigs(prev =>
      prev.map(config => (config.id === configId ? { ...emptyData, id: configId } : config)),
    );

    toast({
      title: "Configuration Cleared",
      description: "All fields have been cleared for this configuration group.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Calculate new distribution considering add, remove, and edit operations
  const calculateNewDistribution = (
    addConfigs: RecipientConfigData[],
    removeConfigs: RecipientConfigData[],
  ) => {
    const currentDist = calculateDistribution(gauges);
    let newTotal = currentDist.total;
    let newDistributed = currentDist.distributed;
    let newRemaining = currentDist.remaining;

    // Process removals first
    const removedAddresses = removeConfigs
      .flatMap(config => config.recipients.filter(r => r.trim()))
      .filter((address, index, self) => self.indexOf(address) === index);

    removedAddresses.forEach(address => {
      const gauge = gauges.find(g => g.gaugeAddress.toLowerCase() === address.toLowerCase());
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

    // Process edited configurations (subtract original, add new)
    editedConfigs.forEach((editedData, gaugeAddress) => {
      const gauge = gauges.find(g => g.gaugeAddress.toLowerCase() === gaugeAddress.toLowerCase());
      if (gauge) {
        // Subtract original gauge configuration
        const originalAmountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
        const originalMaxPeriods = parseInt(gauge.maxPeriods) || 0;
        const originalPeriodNumber = parseInt(gauge.periodNumber) || 0;

        const originalTotal = originalAmountPerPeriod * originalMaxPeriods;
        const originalDistributed = originalAmountPerPeriod * originalPeriodNumber;
        const originalRemaining = originalTotal - originalDistributed;

        newTotal -= originalTotal;
        newDistributed -= originalDistributed;
        newRemaining -= originalRemaining;

        // Add edited configuration for all recipients
        const editedAmountPerPeriod = parseFloat(editedData.amountPerPeriod) || 0;
        const editedMaxPeriods = parseInt(editedData.maxPeriods) || 0;
        const validRecipients = editedData.recipients.filter(r => r.trim()).length;

        const editedTotal = editedAmountPerPeriod * editedMaxPeriods * validRecipients;
        newTotal += editedTotal;
        newRemaining += editedTotal;
      }
    });

    // Process additions
    addConfigs.forEach(config => {
      const amount = parseFloat(config.amountPerPeriod) || 0;
      const periods = parseInt(config.maxPeriods) || 0;
      const validRecipients = config.recipients.filter(r => r.trim()).length;

      const additionalTotal = amount * periods * validRecipients;
      newTotal += additionalTotal;
      newRemaining += additionalTotal;
    });

    return {
      total: newTotal,
      distributed: newDistributed,
      remaining: newRemaining,
    };
  };

  const currentDistribution = calculateDistribution(gauges);
  const newDistribution = calculateNewDistribution(addConfigs, removeConfigs);
  const distributionDelta = newDistribution.total - currentDistribution.total;

  // Check if any rewards are too small
  const hasSmallRewards =
    addConfigs.some(config => {
      const rawAmount = parseInt(config.rawAmountPerPeriod || "0");
      return rawAmount > 0 && rawAmount <= GAUGE_MIN_REWARD_AMOUNT_WEI;
    }) ||
    Array.from(editedConfigs.values()).some(editedData => {
      const rawAmount = parseInt(editedData.rawAmountPerPeriod || "0");
      return rawAmount > 0 && rawAmount <= GAUGE_MIN_REWARD_AMOUNT_WEI;
    });

  // Convert min amount to human readable format for the warning
  const minHumanReadableAmount = tokenDecimals
    ? (GAUGE_MIN_REWARD_AMOUNT_WEI / 10 ** tokenDecimals).toFixed(Math.min(6, tokenDecimals))
    : "0.00";

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

    if (hasSmallRewards) {
      toast({
        title: "Rewards Too Small",
        description: `One or more reward amounts are too small (≤ ${minHumanReadableAmount} ${tokenSymbol}). The gauge cannot handle rewards this small.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }

    try {
      const chainId = Number(getChainId(selectedAddress.network));
      let transactions: Transaction[] = [];

      // Helper function to process configs
      const processConfigs = (configs: RecipientConfigData[], operation: "add" | "remove") => {
        for (const config of configs) {
          const validRecipients = config.recipients.filter(r => r.trim());
          if (validRecipients.length === 0) continue;

          // Skip empty add configurations
          if (operation === "add" && (!config.rawAmountPerPeriod || !config.maxPeriods)) {
            continue;
          }

          const scheduleInputs = validRecipients.map(recipient =>
            operation === "add"
              ? {
                  gaugeAddress: recipient,
                  rawAmountPerPeriod: config.rawAmountPerPeriod,
                  maxPeriods: config.maxPeriods,
                  doNotStartBeforeTimestamp: config.doNotStartBeforeTimestamp,
                }
              : { gaugeAddress: recipient },
          );

          const payload = generateInjectorSchedulePayloadV2({
            injectorAddress: selectedAddress.address,
            chainId: chainId,
            safeAddress: selectedSafe,
            operation,
            scheduleInputs,
          });

          transactions.push(payload.transactions[0]);
        }
      };

      // Process removals first, then additions, then edited configurations
      processConfigs(removeConfigs, "remove");
      processConfigs(addConfigs, "add");

      // Process edited configurations
      editedConfigs.forEach((editedData, gaugeAddress) => {
        const scheduleInputs = editedData.recipients.map(recipient => ({
          gaugeAddress: recipient,
          rawAmountPerPeriod: editedData.rawAmountPerPeriod,
          maxPeriods: editedData.maxPeriods,
          doNotStartBeforeTimestamp: editedData.doNotStartBeforeTimestamp,
        }));

        const payload = generateInjectorSchedulePayloadV2({
          injectorAddress: selectedAddress.address,
          chainId: chainId,
          safeAddress: selectedSafe,
          operation: "add",
          scheduleInputs,
        });

        transactions.push(payload.transactions[0]);
      });

      if (transactions.length === 0 && editedConfigs.size === 0) {
        toast({
          title: "No valid configurations",
          description:
            "Please add at least one valid configuration with recipients or edit an existing configuration.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Determine operation type for metadata
      const hasRemoveOps = removeConfigs.some(config => config.recipients.some(r => r.trim()));
      const hasAddOps = addConfigs.some(
        config =>
          config.recipients.some(r => r.trim()) && config.rawAmountPerPeriod && config.maxPeriods,
      );
      const hasEditOps = editedConfigs.size > 0;

      const operationType =
        hasRemoveOps && (hasAddOps || hasEditOps)
          ? "MIXED"
          : hasAddOps || hasEditOps
            ? "ADD"
            : "REMOVE";

      const finalPayload: BatchFile = {
        version: "1.0",
        chainId: chainId.toString(),
        createdAt: Math.floor(Date.now() / 1000),
        meta: {
          name: `Rewards Injector Schedule - ${operationType}`,
          description: `Configure rewards injector schedule to ${hasRemoveOps && (hasAddOps || hasEditOps) ? "remove and add" : hasAddOps || hasEditOps ? "add" : "remove"} recipients`,
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

  const shouldShowAddSection = () => addConfigs.length > 0;
  const shouldShowRemoveSection = () => removeConfigs.length > 0;
  const hasAnyConfigurations = () =>
    shouldShowAddSection() || shouldShowRemoveSection() || editedConfigs.size > 0;

  // Handle adding a gauge to the remove section
  const handleAddToRemove = (gaugeAddress: string) => {
    // If no remove configs exist, create the remove section with this address
    if (removeConfigs.length === 0) {
      const newConfig = { ...createEmptyConfig("remove"), recipients: [gaugeAddress] };
      setRemoveConfigs([newConfig]);

      toast({
        title: "Added to Remove Section",
        description: `Created Remove Recipients section with: ${gaugeAddress}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Find the first empty remove configuration or add to existing one
    const emptyConfigIndex = removeConfigs.findIndex(
      configGroup => !configGroup.recipients.some(r => r.trim()),
    );

    if (emptyConfigIndex !== -1) {
      const updatedConfig = { ...removeConfigs[emptyConfigIndex], recipients: [gaugeAddress] };
      setRemoveConfigs(prev =>
        prev.map((c, index) => (index === emptyConfigIndex ? updatedConfig : c)),
      );

      toast({
        title: "Added to Remove Section",
        description: `Added ${gaugeAddress} to Remove Configuration Group ${emptyConfigIndex + 1}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // All groups have recipients, add to the first one (since we typically only want one remove group)
      const firstConfig = removeConfigs[0];
      const updatedRecipients = [...firstConfig.recipients];

      // Check if the address is already in the list
      if (!updatedRecipients.includes(gaugeAddress)) {
        updatedRecipients.push(gaugeAddress);

        const updatedConfig = {
          ...firstConfig,
          recipients: updatedRecipients,
        };

        setRemoveConfigs(prev => prev.map((c, index) => (index === 0 ? updatedConfig : c)));

        toast({
          title: "Added to Remove Section",
          description: `Added ${gaugeAddress} to the existing Remove Configuration Group`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Already in Remove Section",
          description: `${gaugeAddress} is already scheduled for removal`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const getPrefillValues = useCallback(() => {
    // Make sure we have a selected injector
    if (!selectedAddress)
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
    let totalAddRecipients = 0;
    let totalRemoveRecipients = 0;
    let totalAmount = 0;

    // Count add configurations
    addConfigs.forEach(config => {
      const validRecipients = config.recipients.filter(r => r.trim()).length;
      if (config.rawAmountPerPeriod && config.maxPeriods) {
        totalAddRecipients += validRecipients;
        const amountPerPeriod = parseFloat(config.amountPerPeriod) || 0;
        const maxPeriods = parseInt(config.maxPeriods) || 0;
        totalAmount += amountPerPeriod * maxPeriods * validRecipients;
      }
    });

    // Count remove configurations
    removeConfigs.forEach(config => {
      totalRemoveRecipients += config.recipients.filter(r => r.trim()).length;
    });

    // Determine operation type and create summary
    let operationType = "";
    let summaryInfo = "";

    if (totalAddRecipients > 0 && totalRemoveRecipients > 0) {
      operationType = "mixed";
      summaryInfo = `adding ${totalAddRecipients} recipient${totalAddRecipients !== 1 ? "s" : ""} with total allocation of ${formatAmount(totalAmount)} ${tokenSymbol} and removing ${totalRemoveRecipients} recipient${totalRemoveRecipients !== 1 ? "s" : ""}`;
    } else if (totalAddRecipients > 0) {
      operationType = "add";
      summaryInfo = `adding ${totalAddRecipients} recipient${totalAddRecipients !== 1 ? "s" : ""} with total allocation of ${formatAmount(totalAmount)} ${tokenSymbol}`;
    } else if (totalRemoveRecipients > 0) {
      operationType = "remove";
      summaryInfo = `removing ${totalRemoveRecipients} recipient${totalRemoveRecipients !== 1 ? "s" : ""}`;
    } else {
      operationType = "config";
      summaryInfo = "updating injector configuration";
    }

    // Create the filename without any path prefix - the path will come from config
    const filename = `injector-${operationType}-recipients-${shortInjectorId}-${uniqueId}.json`;

    return {
      prefillBranchName: `feature/injector-${operationType}-${shortInjectorId}-${uniqueId}`,
      prefillPrName: `${operationType === "add" ? "Add" : operationType === "remove" ? "Remove" : operationType === "mixed" ? "Update" : "Configure"} Recipients for ${tokenSymbol} Injector on ${networkName}`,
      prefillDescription: `This PR updates the rewards injector at ${selectedAddress.address} by ${summaryInfo} on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [selectedAddress, addConfigs, removeConfigs, tokenSymbol]);

  // Generic handler for copying configurations
  const handleCopyConfiguration = (config: {
    gaugeAddress: string;
    amountPerPeriod: string;
    rawAmountPerPeriod: string;
    maxPeriods: string;
    doNotStartBeforeTimestamp: string;
  }) => {
    const newConfig = {
      id: uuidv4(),
      recipients: [config.gaugeAddress],
      amountPerPeriod: config.amountPerPeriod,
      rawAmountPerPeriod: config.rawAmountPerPeriod,
      maxPeriods: config.maxPeriods,
      doNotStartBeforeTimestamp: config.doNotStartBeforeTimestamp,
    };

    if (addConfigs.length === 0) {
      setAddConfigs([newConfig]);
      toast({
        title: "Configuration Copied",
        description: `Created Add Recipients section with: ${config.gaugeAddress} - ${config.amountPerPeriod} ${tokenSymbol} per period for ${config.maxPeriods} periods.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const emptyConfigIndex = addConfigs.findIndex(
      configGroup =>
        !configGroup.recipients.some(r => r.trim()) &&
        !configGroup.amountPerPeriod &&
        !configGroup.maxPeriods,
    );

    if (emptyConfigIndex !== -1) {
      setAddConfigs(prev => prev.map((c, index) => (index === emptyConfigIndex ? newConfig : c)));

      toast({
        title: "Configuration Copied",
        description: `Copied to Configuration Group ${emptyConfigIndex + 1}: ${config.gaugeAddress} with ${config.amountPerPeriod} ${tokenSymbol} per period for ${config.maxPeriods} periods.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } else {
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

  const handleEditConfiguration = (configToEdit: RewardsInjectorData) => {
    // Check if there are existing edits for this gauge
    const existingEdit = editedConfigs.get(configToEdit.gaugeAddress);

    setEditingConfig({
      id: configToEdit.gaugeAddress, // Using gaugeAddress as a unique ID for editing
      data: existingEdit || {
        // If no existing edits, use original values
        recipients: [configToEdit.gaugeAddress], // Start with the current gauge, but allow adding more
        amountPerPeriod: configToEdit.amountPerPeriod,
        rawAmountPerPeriod: configToEdit.rawAmountPerPeriod,
        maxPeriods: configToEdit.maxPeriods,
        doNotStartBeforeTimestamp: "0", // Default to 0, can be changed in edit view
      },
    });
  };

  const handleSaveEditedConfiguration = () => {
    if (!editingConfig) return;

    // Merge the new changes with any existing edits for this gauge
    setEditedConfigs(prev => {
      const existingEdit = prev.get(editingConfig.id);
      const mergedEdit = existingEdit
        ? { ...existingEdit, ...editingConfig.data } // Merge with existing edits
        : editingConfig.data; // No existing edits, use current data

      return new Map(prev.set(editingConfig.id, mergedEdit));
    });

    toast({
      title: "Configuration Saved",
      description: `Configuration for ${editingConfig.id} has been updated. Generate a payload to apply the changes.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    // Exit editing mode
    setEditingConfig(null);
  };

  const handleCancelEdit = () => {
    if (!editingConfig) return;
    setEditingConfig(null);
  };

  const handleEditingDataChange = (newData: EditableRecipientConfigData) => {
    if (!editingConfig) return;
    setEditingConfig(prev => (prev ? { ...prev, data: newData } : null));
  };

  // Reset functions for edited configurations
  const handleResetEditedConfiguration = (gaugeAddress: string) => {
    setEditedConfigs(prev => {
      const newMap = new Map(prev);
      newMap.delete(gaugeAddress);
      return newMap;
    });

    toast({
      title: "Configuration Reset",
      description: `Configuration for ${gaugeAddress} has been reset to its original values.`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Render helper for configuration sections
  const renderConfigSection = (
    configs: RecipientConfigData[],
    title: string,
    operation: "add" | "remove",
    onAddGroup: () => void,
    onRemoveGroup: (configId: string) => void,
    onClearGroup: (configId: string) => void,
  ) => (
    <Box mt={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <VStack align="start" spacing={1}>
          <Heading as="h3" size="md">
            {title}
          </Heading>
          {editingConfig && (
            <Text fontSize="sm" color="orange.500">
              Complete your current edit to modify these configurations.
            </Text>
          )}
        </VStack>
        <Button
          variant="outline"
          leftIcon={<AddIcon />}
          onClick={onAddGroup}
          size="sm"
          isDisabled={editingConfig !== null}
        >
          Add Configuration Group
        </Button>
      </Flex>

      {configs.map((config, index) => {
        const isEmpty =
          operation === "add"
            ? !config.recipients.some(r => r.trim()) &&
              !config.amountPerPeriod &&
              !config.maxPeriods
            : !config.recipients.some(r => r.trim());

        return (
          <Box key={config.id} p={4} mb={4} borderWidth="1px" borderRadius="md" position="relative">
            <Flex justifyContent="space-between" alignItems="center" mb={3}>
              <HStack spacing={2}>
                <Heading as="h4" size="sm">
                  {title} Configuration Group {index + 1}
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
                    onClick={() => onClearGroup(config.id)}
                    colorScheme="gray"
                    variant="ghost"
                    isDisabled={editingConfig !== null}
                  />
                </Tooltip>
                <Tooltip label="Delete this configuration group">
                  <IconButton
                    aria-label="Delete configuration"
                    icon={<DeleteIcon />}
                    size="sm"
                    onClick={() => onRemoveGroup(config.id)}
                    colorScheme="red"
                    variant="ghost"
                    isDisabled={editingConfig !== null}
                  />
                </Tooltip>
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
              onConfigChange={newConfig =>
                operation === "add"
                  ? handleAddConfigChange(newConfig, config.id)
                  : handleRemoveConfigChange(newConfig, config.id)
              }
              isDisabled={editingConfig !== null}
            />
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Container maxW="container.xl">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Injector Schedule Payload Configurator
        </Heading>
        <Text mb={6}>
          Build a injector schedule payload to add new recipients and remove existing ones.
          Configure both operations simultaneously for maximum flexibility.
        </Text>
      </Box>
      <Flex justifyContent="space-between" alignItems="center" verticalAlign="center" mb={4}>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            isDisabled={isLoading || editingConfig !== null}
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
            isDisabled={editingConfig !== null}
          />
          <FormLabel htmlFor="version-switch" mb="0" ml={2}>
            V2
          </FormLabel>
        </FormControl>
      </Flex>

      {selectedAddress && !isLoading && (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
            <Card borderWidth="1px" borderRadius="xl">
              <VStack spacing={4} align="stretch" p={4}>
                <HStack justify="space-between" align="center">
                  <Badge colorScheme="gray" variant="subtle" size="sm">
                    Current
                  </Badge>
                </HStack>
                <Stat>
                  <StatLabel fontSize="md">Total Distribution</StatLabel>
                  <StatNumber fontSize="2xl">
                    {formatAmount(currentDistribution.total)} {tokenSymbol}
                  </StatNumber>
                  <StatHelpText fontSize="sm">
                    Distributed: {formatAmount(currentDistribution.distributed)} | Remaining:{" "}
                    {formatAmount(currentDistribution.remaining)}
                  </StatHelpText>
                </Stat>
                {currentDistribution.total > 0 && (
                  <Progress
                    value={(currentDistribution.distributed / currentDistribution.total) * 100}
                    colorScheme="gray"
                    size="md"
                    borderRadius="full"
                  />
                )}
              </VStack>
            </Card>

            <Card borderWidth="1px" borderRadius="xl">
              <VStack spacing={4} align="stretch" p={4}>
                <HStack justify="space-between" align="center">
                  <Badge colorScheme="blue" variant="subtle" size="sm">
                    Preview
                  </Badge>
                </HStack>
                <Stat>
                  <StatLabel fontSize="md">New Total Distribution</StatLabel>
                  <StatNumber fontSize="2xl">
                    {formatAmount(newDistribution.total)} {tokenSymbol}
                  </StatNumber>
                  <StatHelpText fontSize="sm">After configuration changes</StatHelpText>
                </Stat>
                {newDistribution.total > 0 && (
                  <Progress
                    value={(newDistribution.distributed / newDistribution.total) * 100}
                    colorScheme="gray"
                    size="md"
                    borderRadius="full"
                  />
                )}
              </VStack>
            </Card>

            <Card borderWidth="2px" borderRadius="xl">
              <VStack spacing={4} align="stretch" p={4}>
                <HStack justify="space-between" align="center">
                  <Badge
                    colorScheme={
                      distributionDelta === 0 ? "gray" : distributionDelta > 0 ? "green" : "red"
                    }
                    variant="subtle"
                    size="sm"
                  >
                    {distributionDelta === 0
                      ? "No Change"
                      : distributionDelta > 0
                        ? "Increase"
                        : "Decrease"}
                  </Badge>
                </HStack>
                <Stat>
                  <StatLabel fontSize="md">Distribution Delta</StatLabel>
                  <StatNumber
                    fontSize="2xl"
                    color={
                      distributionDelta === 0
                        ? "gray.500"
                        : distributionDelta > 0
                          ? successColor
                          : errorColor
                    }
                  >
                    {distributionDelta >= 0 ? "+" : ""}
                    {formatAmount(distributionDelta)} {tokenSymbol}
                  </StatNumber>
                  <StatHelpText fontSize="sm">
                    {distributionDelta > contractBalance
                      ? `⚠️ Insufficient funds (need ${formatAmount(distributionDelta - contractBalance)} more)`
                      : distributionDelta === 0
                        ? "No additional funding required"
                        : "Within available balance"}
                  </StatHelpText>
                </Stat>
              </VStack>
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
                One or more reward amounts are too small (≤ {GAUGE_MIN_REWARD_AMOUNT_WEI} WEI or{" "}
                {minHumanReadableAmount} {tokenSymbol}). The gauge cannot handle rewards this small.
                Please increase the reward amount to be at least 1 WEI / second.
              </AlertDescription>
            </Alert>
          )}

          <Alert status="info" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <Box>
              <AlertTitle>Ready to configure!</AlertTitle>
              <AlertDescription>
                Use the sections below to add new recipients and remove existing ones. Both
                operations can be configured simultaneously and will be combined into a single
                payload.
              </AlertDescription>
            </Box>
          </Alert>

          <Box mt={8}>
            <VStack spacing={6} align="stretch">
              <Flex justifyContent="space-between" alignItems="center">
                <Heading as="h2" size="lg">
                  Current Configuration
                </Heading>

                <VStack spacing={2} align="end">
                  <Text fontSize="xs" color="gray.500" textAlign="right">
                    💡 Copy buttons populate the "Add Recipients" section | Trash buttons populate
                    the "Remove Recipients" section
                  </Text>
                </VStack>
              </Flex>

              <RewardsInjectorConfigurationViewerV2
                data={gauges}
                tokenSymbol={tokenSymbol}
                tokenDecimals={tokenDecimals}
                onCopyConfiguration={handleCopyConfiguration}
                onEditConfiguration={handleEditConfiguration}
                onAddToRemove={handleAddToRemove}
                showCopyButtons={true}
                showTrashButtons={true}
                showEditButtons={true}
                editingGaugeId={editingConfig?.id || null}
                editingData={editingConfig?.data || null}
                onEditingDataChange={handleEditingDataChange}
                onSaveEdit={handleSaveEditedConfiguration}
                onCancelEdit={handleCancelEdit}
                editedConfigs={editedConfigs}
                onResetEditedConfiguration={handleResetEditedConfiguration}
              />
            </VStack>
          </Box>

          {/* Configuration Actions */}
          {!hasAnyConfigurations() && (
            <Box mt={8}>
              <Card borderWidth="1px" borderRadius="xl" overflow="hidden">
                <CardBody p={6}>
                  <VStack spacing={4} align="center">
                    <Heading as="h3" size="md" textAlign="center">
                      Configure Recipients
                    </Heading>
                    <Text textAlign="center" color={mutedTextColor}>
                      Add new recipients or remove existing ones from the injector schedule.
                      {editingConfig && (
                        <Text fontSize="sm" color="orange.500" mt={2}>
                          Complete your current edit to access these actions.
                        </Text>
                      )}
                    </Text>
                    <HStack spacing={4}>
                      <Button
                        leftIcon={<AddIcon />}
                        onClick={addAddConfigGroup}
                        colorScheme="green"
                        variant="outline"
                        isDisabled={editingConfig !== null}
                      >
                        Add Recipients
                      </Button>
                      <Button
                        leftIcon={<DeleteIcon />}
                        onClick={addRemoveConfigGroup}
                        colorScheme="red"
                        variant="outline"
                        isDisabled={editingConfig !== null}
                      >
                        Remove Recipients
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          )}

          {hasAnyConfigurations() && !shouldShowAddSection() && (
            <Box mt={8}>
              <Card borderWidth="1px" borderColor="green.200" borderRadius="xl" overflow="hidden">
                <CardBody p={4}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <VStack spacing={1} align="start">
                      <Text fontWeight="medium" color="green.500">
                        Want to add recipients?
                      </Text>
                      <Text fontSize="sm" color={mutedTextColor}>
                        Create a configuration group to add new recipients to the injector.
                        {editingConfig && (
                          <Text fontSize="xs" color="orange.500" mt={1}>
                            Complete your current edit first.
                          </Text>
                        )}
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={addAddConfigGroup}
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      isDisabled={editingConfig !== null}
                    >
                      Add Recipients
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
            </Box>
          )}

          {hasAnyConfigurations() && !shouldShowRemoveSection() && (
            <Box mt={8}>
              <Card borderWidth="1px" borderColor="red.200" borderRadius="xl" overflow="hidden">
                <CardBody p={4}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <VStack spacing={1} align="start">
                      <Text fontWeight="medium" color="red.500">
                        Want to remove recipients?
                      </Text>
                      <Text fontSize="sm" color={mutedTextColor}>
                        Create a configuration group to remove existing recipients from the
                        injector.
                        {editingConfig && (
                          <Text fontSize="xs" color="orange.500" mt={1}>
                            Complete your current edit first.
                          </Text>
                        )}
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<DeleteIcon />}
                      onClick={addRemoveConfigGroup}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      isDisabled={editingConfig !== null}
                    >
                      Remove Recipients
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* Add Recipients Section */}
          {shouldShowAddSection() &&
            renderConfigSection(
              addConfigs,
              "+ Add Recipients",
              "add",
              addAddConfigGroup,
              removeAddConfigGroup,
              clearAddConfigGroup,
            )}

          {/* Remove Recipients Section */}
          {shouldShowRemoveSection() &&
            renderConfigSection(
              removeConfigs,
              "- Remove Recipients",
              "remove",
              addRemoveConfigGroup,
              removeRemoveConfigGroup,
              clearRemoveConfigGroup,
            )}
        </>
      )}

      {isLoading && (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {selectedAddress && !isLoading && (
        <Flex justifyContent="space-between" mt={6} mb={6}>
          <Button
            variant="primary"
            onClick={generatePayload}
            isDisabled={!hasAnyConfigurations() || editingConfig !== null}
          >
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
