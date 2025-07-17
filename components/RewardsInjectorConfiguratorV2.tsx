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
  useColorModeValue,
  useDisclosure,
  useMediaQuery,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ChevronDownIcon, CopyIcon, DownloadIcon, ExternalLinkIcon } from "@chakra-ui/icons";
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
import { RewardsInjectorConfiguratorTable } from "./tables/RewardsInjectorConfiguratorTable";
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
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(0);

  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [originalGauges, setOriginalGauges] = useState<RewardsInjectorData[]>([]);
  const [editedGauges, setEditedGauges] = useState<Set<number>>(new Set());
  const [removedGauges, setRemovedGauges] = useState<RewardsInjectorData[]>([]);
  const [newlyAddedGauges, setNewlyAddedGauges] = useState<RewardsInjectorData[]>([]);

  const [generatedPayload, setGeneratedPayload] = useState<BatchFile | null>(null);

  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (selectedAddress && injectorData) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setTokenDecimals(injectorData.tokenInfo.decimals);
      setGauges(injectorData.gauges);
      setOriginalGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);
      // Reset all change tracking when new data is loaded
      setEditedGauges(new Set());
      setRemovedGauges([]);
      setNewlyAddedGauges([]);
    }
  }, [selectedAddress, injectorData]);

  const handleSaveEdit = (index: number, updatedGauge: RewardsInjectorData) => {
    const newGauges = [...gauges];
    newGauges[index] = { ...updatedGauge, isEdited: true };
    setGauges(newGauges);
    setEditedGauges(prev => new Set(prev).add(index));

    toast({
      title: "Configuration Updated",
      description:
        "The gauge configuration has been marked as edited. Generate payload to apply changes.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleAddRecipient = (newGauge: RewardsInjectorData) => {
    // Add a unique identifier to track this as a newly added gauge
    const id = crypto.randomUUID();
    const gaugeWithId = { ...newGauge, isEdited: true, id };
    const newGauges = [...gauges, gaugeWithId];
    setGauges(newGauges);
    setNewlyAddedGauges(prev => [...prev, gaugeWithId]);

    toast({
      title: "Recipient Added",
      description: "The new recipient has been added to the configuration.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // handleCancelAddRecipient is no longer needed in parent - managed entirely by table component

  const handleDelete = (index: number, gauge: RewardsInjectorData) => {
    // Remove the gauge from the current gauges list
    const newGauges = gauges.filter((_, i) => i !== index);
    setGauges(newGauges);

    // Check if this gauge was newly added (in which case, just remove it from newlyAddedGauges)
    const wasNewlyAdded = newlyAddedGauges.some(newGauge => newGauge.id === gauge.id);

    if (wasNewlyAdded) {
      // Remove from newly added gauges list
      setNewlyAddedGauges(prev => prev.filter(newGauge => newGauge.id !== gauge.id));
    } else {
      // Add to removed gauges list for payload generation (only for originally existing gauges)
      setRemovedGauges(prev => [...prev, gauge]);
    }

    // Update edited gauges set to remove this index and adjust indices
    setEditedGauges(prev => {
      const newSet = new Set<number>();
      prev.forEach(editedIndex => {
        if (editedIndex < index) {
          newSet.add(editedIndex);
        } else if (editedIndex > index) {
          newSet.add(editedIndex - 1);
        }
        // Skip the deleted index
      });
      return newSet;
    });

    toast({
      title: "Configuration Removed",
      description: "The gauge has been removed from the table. Generate payload to apply changes.",
      status: "warning",
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

  const calculateNewDistribution = () => {
    let newDistribution = { total: 0, distributed: 0, remaining: 0 };

    // Process each current gauge
    gauges.forEach((gauge, index) => {
      const newAmountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
      const maxPeriods = parseInt(gauge.maxPeriods) || 0;
      const periodNumber = parseInt(gauge.periodNumber) || 0;

      // Check if this gauge was edited
      if (editedGauges.has(index)) {
        // For edited gauges: preserve already distributed amount, apply new rate to remaining periods
        const originalGauge = originalGauges.find(orig => orig.gaugeAddress === gauge.gaugeAddress);
        if (originalGauge) {
          const originalAmountPerPeriod = parseFloat(originalGauge.amountPerPeriod) || 0;
          const originalPeriodNumber = parseInt(originalGauge.periodNumber) || 0;
          const alreadyDistributed = originalAmountPerPeriod * originalPeriodNumber;
          const futureDistribution = newAmountPerPeriod * maxPeriods; // New configuration starts fresh

          newDistribution.distributed += alreadyDistributed;
          newDistribution.remaining += futureDistribution;
          newDistribution.total += alreadyDistributed + futureDistribution;
        }
      } else {
        // For non-edited gauges (original or newly added): use standard calculation
        const gaugeTotal = newAmountPerPeriod * maxPeriods;
        const gaugeDistributed = newAmountPerPeriod * periodNumber;
        const gaugeRemaining = gaugeTotal - gaugeDistributed;

        newDistribution.total += gaugeTotal;
        newDistribution.distributed += gaugeDistributed;
        newDistribution.remaining += gaugeRemaining;
      }
    });

    // For deleted gauges, we need to preserve the already distributed amount
    // because those tokens were already distributed and can't be "undistributed"
    // Use ORIGINAL values for calculating already distributed amount
    removedGauges.forEach(gauge => {
      // Find the original gauge to get the correct distributed amount
      const originalGauge = originalGauges.find(orig => orig.gaugeAddress === gauge.gaugeAddress);

      if (originalGauge) {
        // Use original values for calculating what was already distributed
        const originalAmountPerPeriod = parseFloat(originalGauge.amountPerPeriod) || 0;
        const periodNumber = parseInt(originalGauge.periodNumber) || 0;
        const alreadyDistributed = originalAmountPerPeriod * periodNumber;

        // Only add the distributed amount - future distributions are cancelled
        newDistribution.distributed += alreadyDistributed;
        newDistribution.total += alreadyDistributed;
      }
    });

    return newDistribution;
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentDistribution = calculateCurrentDistribution(originalGauges);
  const newDistribution = calculateNewDistribution();
  const distributionDelta = newDistribution.remaining - currentDistribution.remaining;

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
      const chainId = Number(getChainId(selectedAddress.network));
      let transactions: Transaction[] = [];

      // Include edited configurations as addRecipients
      if (editedGauges.size > 0) {
        editedGauges.forEach(index => {
          const gauge = gauges[index];
          const addPayload = generateInjectorSchedulePayloadV2({
            injectorAddress: selectedAddress.address,
            chainId: chainId,
            safeAddress: selectedSafe,
            operation: "add",
            scheduleInputs: [
              {
                gaugeAddress: gauge.gaugeAddress,
                rawAmountPerPeriod: gauge.rawAmountPerPeriod,
                maxPeriods: gauge.maxPeriods,
                doNotStartBeforeTimestamp: gauge.doNotStartBeforeTimestamp || "0",
              },
            ],
          });
          transactions.push(addPayload.transactions[0]);
        });
      }

      // Add newly added recipients
      if (newlyAddedGauges.length > 0) {
        newlyAddedGauges.forEach(gauge => {
          const addPayload = generateInjectorSchedulePayloadV2({
            injectorAddress: selectedAddress.address,
            chainId: chainId,
            safeAddress: selectedSafe,
            operation: "add",
            scheduleInputs: [
              {
                gaugeAddress: gauge.gaugeAddress,
                rawAmountPerPeriod: gauge.rawAmountPerPeriod,
                maxPeriods: gauge.maxPeriods,
                doNotStartBeforeTimestamp: gauge.doNotStartBeforeTimestamp || "0",
              },
            ],
          });
          transactions.push(addPayload.transactions[0]);
        });
      }

      // Remove recipients - batch all removed gauges into a single transaction
      if (removedGauges.length > 0) {
        const removePayload = generateInjectorSchedulePayloadV2({
          injectorAddress: selectedAddress.address,
          chainId: chainId,
          safeAddress: selectedSafe,
          operation: "remove",
          scheduleInputs: removedGauges.map(gauge => ({
            gaugeAddress: gauge.gaugeAddress,
          })),
        });
        transactions.push(removePayload.transactions[0]);
      }

      if (transactions.length === 0) {
        toast({
          title: "No changes to apply",
          description: "Please edit configurations or add recipients.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const finalPayload: BatchFile = {
        version: "1.0",
        chainId: chainId.toString(),
        createdAt: Math.floor(Date.now() / 1000),
        meta: {
          name: "Rewards Injector Configuration Update",
          description: "Update rewards injector configurations",
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
    if (!selectedAddress)
      return {
        prefillBranchName: "",
        prefillPrName: "",
        prefillDescription: "",
        prefillFilename: "",
      };

    const uniqueId = generateUniqueId();
    const shortInjectorId = selectedAddress.address.substring(0, 8);
    const networkName = selectedAddress.network;

    const operationCount = editedGauges.size + newlyAddedGauges.length + removedGauges.length;
    const summaryInfo = `updating ${operationCount} configuration${operationCount !== 1 ? "s" : ""}`;

    const filename = `injector-update-${shortInjectorId}-${uniqueId}.json`;

    return {
      prefillBranchName: `feature/injector-update-${shortInjectorId}-${uniqueId}`,
      prefillPrName: `Update ${tokenSymbol} Injector Configuration on ${networkName}`,
      prefillDescription: `This PR updates the rewards injector at ${selectedAddress.address} by ${summaryInfo} on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [
    selectedAddress,
    editedGauges.size,
    newlyAddedGauges.length,
    tokenSymbol,
    removedGauges.length,
  ]);

  return (
    <Container maxW="container.xl">
      <Box>
        <Box mb="10px">
          <Heading as="h2" size="lg" variant="special">
            Injector Configuration Manager
          </Heading>
          <Text mb={6}>Manage reward emissions configuration for the selected injector.</Text>
        </Box>

        <Flex justifyContent="space-between" alignItems="center" verticalAlign="center" mb={6}>
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
                  key={`${address.network}-${address.address}`}
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
              aria-label="View on explorer"
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
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              spacing={4}
              p={4}
              bg="background.level1"
              borderRadius="lg"
              shadow="md"
              borderWidth="1px"
              borderColor="transparent"
              mb={6}
            >
              <VStack spacing={1}>
                <Text
                  fontSize="xs"
                  color={useColorModeValue("gray.600", "gray.400")}
                  textAlign="center"
                >
                  Contract Balance
                </Text>
                <Text fontSize="xl" fontWeight="semibold">
                  {formatAmount(contractBalance)} {tokenSymbol}
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text
                  fontSize="xs"
                  color={useColorModeValue("gray.600", "gray.400")}
                  textAlign="center"
                >
                  Current Distribution
                </Text>
                <Text fontSize="xl" fontWeight="semibold">
                  {formatAmount(currentDistribution.total)} {tokenSymbol}
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text
                  fontSize="xs"
                  color={useColorModeValue("gray.600", "gray.400")}
                  textAlign="center"
                >
                  New Distribution
                </Text>
                <Text fontSize="xl" fontWeight="semibold">
                  {formatAmount(newDistribution.total)} {tokenSymbol}
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text
                  fontSize="xs"
                  color={useColorModeValue("gray.600", "gray.400")}
                  textAlign="center"
                >
                  Distribution Delta
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight="semibold"
                  color={
                    distributionDelta > 0
                      ? "green.400"
                      : distributionDelta < 0
                        ? "red.400"
                        : "gray.600"
                  }
                >
                  {distributionDelta >= 0 ? "+" : ""}
                  {formatAmount(distributionDelta)} {tokenSymbol}
                </Text>
              </VStack>
            </SimpleGrid>

            {distributionDelta > contractBalance && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <AlertTitle mr={2}>Insufficient Funds!</AlertTitle>
                <AlertDescription>
                  Additional {formatAmount(distributionDelta - contractBalance)} {tokenSymbol}{" "}
                  required to complete all future distributions.
                </AlertDescription>
              </Alert>
            )}

            <Box mt={6}>
              <Box mb={4}>
                <Heading size="lg">Current Configuration</Heading>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {gauges.length} recipient{gauges.length !== 1 ? "s" : ""} configured
                  {(editedGauges.size > 0 ||
                    newlyAddedGauges.length > 0 ||
                    removedGauges.length > 0) && (
                    <Text as="span" ml={2} color="orange.400">
                      • {editedGauges.size + newlyAddedGauges.length + removedGauges.length} pending
                      change
                      {editedGauges.size + newlyAddedGauges.length + removedGauges.length !== 1
                        ? "s"
                        : ""}
                    </Text>
                  )}
                </Text>
              </Box>
              <RewardsInjectorConfiguratorTable
                data={gauges}
                tokenSymbol={tokenSymbol}
                tokenDecimals={tokenDecimals}
                onDelete={handleDelete}
                onSaveEdit={handleSaveEdit}
                onAddRecipient={handleAddRecipient}
                newlyAddedGauges={newlyAddedGauges}
              />
            </Box>
          </>
        )}

        <Divider my={4} />

        {isLoading && (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        )}

        {selectedAddress && !isLoading && (
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
      </Box>
    </Container>
  );
}

export default RewardsInjectorConfiguratorV2;
