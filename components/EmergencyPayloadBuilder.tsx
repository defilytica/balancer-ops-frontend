"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  InfoIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  generateEmergencyPayload,
  generateHumanReadableEmergency,
  handleDownloadClick,
  EmergencyActionInput,
  EmergencyPayloadInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import {
  GetV3PoolsDocument,
  GetV3PoolsQuery,
  GetV3PoolsQueryVariables,
  GetPoolsDocument,
  GetPoolsQuery,
  GetPoolsQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import { PRCreationModal } from "@/components/modal/PRModal";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { getNetworksWithCategory, getAddress } from "@/lib/data/maxis/addressBook";
import OpenPRButton from "@/components/btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { NetworkSelector } from "@/components/NetworkSelector";
import PoolSelector from "@/components/PoolSelector";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";

interface SelectedPool extends Pool {
  selectedActions: ("pause" | "enableRecoveryMode")[];
  isV3Pool: boolean;
  pauseMethod?: "pause" | "setPaused"; // For v2 pools only
}

interface EmergencyPayloadBuilderProps {
  addressBook: AddressBook;
}

export default function EmergencyPayloadBuilder({ addressBook }: EmergencyPayloadBuilderProps) {
  const [protocolVersion, setProtocolVersion] = useState<"v2" | "v3" | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPools, setSelectedPools] = useState<SelectedPool[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const [emergencyWallet, setEmergencyWallet] = useState<string>("");
  const [globalPauseMethod, setGlobalPauseMethod] = useState<"pause" | "setPaused">("pause");
  const [vaultActions, setVaultActions] = useState<("pauseVault" | "pauseVaultBuffers")[]>([]); // For V3 vault-level actions

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get available networks based on protocol version
  const availableNetworkOptions = useMemo(() => {
    if (!protocolVersion) return [];

    if (protocolVersion === "v3") {
      // For V3, only show networks with V3 vault deployed
      const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
      return NETWORK_OPTIONS.filter(
        network =>
          networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
      );
    } else {
      // For V2, show all networks except SONIC
      return NETWORK_OPTIONS.filter(network => network.apiID !== "SONIC");
    }
  }, [protocolVersion, addressBook]);

  // Query V3 pools (only when V3 is selected)
  const {
    loading: v3Loading,
    error: v3Error,
    data: v3Data,
  } = useQuery<GetV3PoolsQuery, GetV3PoolsQueryVariables>(GetV3PoolsDocument, {
    variables: { chainIn: [selectedNetwork as any] },
    skip: !selectedNetwork || protocolVersion !== "v3",
  });

  // Query V2 pools (only when V2 is selected)
  const {
    loading: v2Loading,
    error: v2Error,
    data: v2Data,
  } = useQuery<GetPoolsQuery, GetPoolsQueryVariables>(GetPoolsDocument, {
    variables: { chainIn: [selectedNetwork as any] },
    skip: !selectedNetwork || protocolVersion !== "v2",
  });

  // Get pools based on selected protocol
  const availablePools = useMemo(() => {
    if (protocolVersion === "v3" && v3Data?.poolGetPools) {
      return v3Data.poolGetPools.map(pool => ({ ...pool, isV3Pool: true }));
    } else if (protocolVersion === "v2" && v2Data?.poolGetPools) {
      // Filter to only include pools with protocolVersion: 2
      return v2Data.poolGetPools
        .filter(pool => pool.protocolVersion === 2)
        .map(pool => ({ ...pool, isV3Pool: false }));
    }
    return [];
  }, [protocolVersion, v3Data, v2Data]);

  const loading = protocolVersion === "v3" ? v3Loading : v2Loading;
  const error = protocolVersion === "v3" ? v3Error : v2Error;

  // Resolve emergency wallet when network changes
  useEffect(() => {
    if (selectedNetwork) {
      const wallet = getAddress(
        addressBook,
        selectedNetwork.toLowerCase(),
        "multisigs",
        "emergency",
      );
      setEmergencyWallet(wallet || "");
    }
  }, [selectedNetwork, addressBook]);

  const handleProtocolVersionChange = useCallback((version: "v2" | "v3") => {
    setProtocolVersion(version);
    setSelectedNetwork("");
    setSelectedPools([]);
    setVaultActions([]);
    setGeneratedPayload(null);
    setHumanReadableText(null);
    setGlobalPauseMethod("pause"); // Reset to default
  }, []);

  const handleNetworkChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedPools([]);
    setVaultActions([]);
    setGeneratedPayload(null);
    setHumanReadableText(null);
  }, []);

  const handlePoolSelect = useCallback(
    (pool: Pool & { isV3Pool?: boolean }) => {
      setSelectedPools(prev => {
        // Check if pool is already selected
        const existingIndex = prev.findIndex(p => p.address === pool.address);
        if (existingIndex >= 0) {
          return prev; // Pool already selected
        }

        // Add pool with default actions and protocol version
        const isV3Pool = protocolVersion === "v3";
        return [
          ...prev,
          {
            ...pool,
            selectedActions: ["pause"],
            isV3Pool,
            pauseMethod: isV3Pool ? undefined : globalPauseMethod,
          },
        ];
      });
    },
    [protocolVersion, globalPauseMethod],
  );

  const handleRemovePool = useCallback((poolAddress: string) => {
    setSelectedPools(prev => prev.filter(p => p.address !== poolAddress));
  }, []);

  const handleActionChange = useCallback((poolAddress: string, actions: string[]) => {
    setSelectedPools(prev =>
      prev.map(pool =>
        pool.address === poolAddress
          ? {
              ...pool,
              selectedActions: actions as ("pause" | "enableRecoveryMode")[],
            }
          : pool,
      ),
    );
  }, []);

  const handleVaultActionChange = useCallback((actions: string[]) => {
    setVaultActions(actions as ("pauseVault" | "pauseVaultBuffers")[]);
  }, []);

  const handlePauseMethodChange = useCallback(
    (poolAddress: string, method: "pause" | "setPaused") => {
      setSelectedPools(prev =>
        prev.map(pool => (pool.address === poolAddress ? { ...pool, pauseMethod: method } : pool)),
      );
    },
    [],
  );

  const handleGlobalPauseMethodChange = useCallback((method: "pause" | "setPaused") => {
    setGlobalPauseMethod(method);
    // Update all existing v2 pools to use the new method
    setSelectedPools(prev =>
      prev.map(pool => (!pool.isV3Pool ? { ...pool, pauseMethod: method } : pool)),
    );
  }, []);

  const handleGenerateClick = useCallback(() => {
    if (selectedPools.length === 0 && vaultActions.length === 0) {
      toast({
        title: "No actions selected",
        description: "Please select at least one pool action or vault action for emergency actions",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!emergencyWallet) {
      toast({
        title: "Emergency wallet not found",
        description: "Emergency wallet address could not be resolved for this network",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!protocolVersion) {
      toast({
        title: "Protocol version not selected",
        description: "Please select a protocol version first",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    if (!networkOption) {
      toast({
        title: "Invalid network",
        description: "Selected network is not valid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Get vault address only for V3 operations
    let vaultAddress;
    if (protocolVersion === "v3") {
      vaultAddress = getAddress(
        addressBook,
        selectedNetwork.toLowerCase(),
        "20241204-v3-vault",
        "Vault",
      );

      if (!vaultAddress) {
        toast({
          title: "Vault address not found",
          description: "V3 Vault address could not be resolved for this network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    const emergencyActions: EmergencyActionInput[] = selectedPools
      .filter(pool => pool.selectedActions.length > 0)
      .map(pool => ({
        poolAddress: pool.address,
        poolName: pool.name,
        actions: pool.selectedActions,
        isV3Pool: protocolVersion === "v3",
        pauseMethod: pool.pauseMethod || "pause",
      }));

    const payloadInput: EmergencyPayloadInput = {
      pools: emergencyActions,
      emergencyWallet,
      chainId: networkOption.chainId,
      vaultAddress,
      vaultActions: protocolVersion === "v3" ? vaultActions : [],
    };

    const payload = generateEmergencyPayload(payloadInput);
    const humanReadable = generateHumanReadableEmergency(payloadInput);

    setGeneratedPayload(JSON.stringify(payload, null, 2));
    setHumanReadableText(humanReadable);
  }, [selectedPools, vaultActions, emergencyWallet, selectedNetwork, addressBook, protocolVersion]);

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

  const getPrefillValues = useCallback(() => {
    if (selectedPools.length === 0 || !protocolVersion) return {};

    const uniqueId = generateUniqueId();
    const firstPoolId = selectedPools[0].address.substring(0, 8);

    // Count total actions
    const totalActions = selectedPools.reduce((sum, pool) => sum + pool.selectedActions.length, 0);

    // Get network name
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const networkName = networkOption?.label || selectedNetwork;
    const networkPath = networkName === "Ethereum" ? "Mainnet" : networkName;

    const filename =
      networkPath + `/emergency-actions-${protocolVersion}-${firstPoolId}-${uniqueId}.json`;

    return {
      prefillBranchName: `emergency/${protocolVersion}-pools-${firstPoolId}-${uniqueId}`,
      prefillPrName: `Emergency Actions for ${selectedPools.length} ${protocolVersion.toUpperCase()} Pool${selectedPools.length !== 1 ? "s" : ""} on ${networkName}`,
      prefillDescription: `Emergency actions: ${totalActions} action${totalActions !== 1 ? "s" : ""} across ${selectedPools.length} ${protocolVersion} pool${selectedPools.length !== 1 ? "s" : ""} on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [selectedPools, selectedNetwork, protocolVersion]);

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        Emergency Actions Payload Builder
      </Heading>

      <Alert status="warning" mb={6} py={3} variant="left-accent" borderRadius="md">
        <Box flex="1">
          <Flex align="center">
            <AlertIcon boxSize="20px" />
            <AlertTitle fontSize="lg" ml={2}>
              Emergency SubDAO Actions
            </AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <Text fontSize="sm" mb={2}>
              This tool creates payloads for emergency actions that can be executed by the Emergency
              SubDAO wallet.
            </Text>
            <List spacing={2} fontSize="sm">
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="orange.500" />
                <strong>Pause Pool/Vault:</strong> Immediately stops all operations on the selected
                pool or vault
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="orange.500" />
                <strong>Enable Recovery Mode:</strong> Allows proportional withdrawals only
              </ListItem>
              <ListItem>
                <ListIcon as={WarningIcon} color="red.500" />
                These actions should only be used in genuine emergency situations
              </ListItem>
            </List>
          </AlertDescription>
        </Box>
      </Alert>

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={12}>
          <Heading as="h3" size="md" mb={4}>
            Select Protocol Version
          </Heading>
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme={protocolVersion === "v2" ? "blue" : "gray"}
              variant={protocolVersion === "v2" ? "solid" : "outline"}
              onClick={() => handleProtocolVersionChange("v2")}
              leftIcon={<Badge colorScheme="blue">V2</Badge>}
            >
              Balancer v2 Pools
            </Button>
            <Button
              size="lg"
              colorScheme={protocolVersion === "v3" ? "purple" : "gray"}
              variant={protocolVersion === "v3" ? "solid" : "outline"}
              onClick={() => handleProtocolVersionChange("v3")}
              leftIcon={<Badge colorScheme="purple">V3</Badge>}
            >
              Balancer v3 Pools
            </Button>
          </HStack>
          {protocolVersion && (
            <Alert
              status={"info"}
              mt={3}
              p={3}
              borderRadius="md"
              borderLeftWidth="4px"
              borderLeftColor={protocolVersion === "v3" ? "purple.500" : "blue.500"}
            >
              <Text fontSize="sm">
                {protocolVersion === "v2" ? (
                  <>
                    Actions will be called directly on each pool contract (pause() or setPaused(),
                    enableRecoveryMode())
                  </>
                ) : (
                  <>
                    Actions will be called through the Vault contract (pauseVault(),
                    enableRecoveryMode())
                  </>
                )}
              </Text>
            </Alert>
          )}
        </GridItem>
      </Grid>

      {/* Step 1.5: V2 Pause Method Selection */}
      {protocolVersion === "v2" && (
        <Box mb={6}>
          <Heading as="h3" size="md" mb={4}>
            V2 Pool Pause Method Selection
          </Heading>
          <Card>
            <CardBody>
              <FormControl>
                <FormLabel fontSize="md" fontWeight="bold">
                  Choose Pause Method for V2 Pools
                </FormLabel>
                <RadioGroup value={globalPauseMethod} onChange={handleGlobalPauseMethodChange}>
                  <VStack align="start" spacing={3}>
                    <Radio value="pause" colorScheme="blue">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">pause() - Modern V2 Pools</Text>
                        <Text fontSize="sm" color="gray.600">
                          Use for newer Balancer v2 pools (most common)
                        </Text>
                      </VStack>
                    </Radio>
                    <Radio value="setPaused" colorScheme="orange">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">setPaused(true) - Legacy V2 Pools</Text>
                        <Text fontSize="sm" color="gray.600">
                          Use for older Balancer v2 pools that don't have the pause() method
                        </Text>
                      </VStack>
                    </Radio>
                  </VStack>
                </RadioGroup>
                <Alert status="info" mt={4} size="sm">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      <strong>Not sure which to use?</strong> Try pause() first (default). If the
                      transaction fails, use setPaused(true) instead. You can change this for
                      individual pools later.
                    </Text>
                  </Box>
                </Alert>
              </FormControl>
            </CardBody>
          </Card>
        </Box>
      )}

      {protocolVersion && (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
          <GridItem colSpan={{ base: 12, md: 4 }}>
            <NetworkSelector
              networks={networks}
              networkOptions={availableNetworkOptions}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Network"
            />
          </GridItem>
        </Grid>
      )}

      {/* Emergency Wallet Display */}
      {emergencyWallet && (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
          <GridItem colSpan={{ base: 12, md: 6 }}>
            <Card>
              <CardBody>
                <Text fontSize="sm" fontWeight={"bold"} mb={1}>
                  Emergency Wallet for {selectedNetwork}
                </Text>
                <Text fontFamily="mono" fontSize="sm">
                  {emergencyWallet}
                </Text>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      )}

      {protocolVersion === "v3" && selectedNetwork && (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
          <GridItem colSpan={12}>
            <Heading as="h3" size="md" mb={4}>
              V3 Vault-Level Emergency Actions
            </Heading>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <AlertDescription>
                These actions affect the entire V3 vault on {selectedNetwork}. No pool selection
                needed.
              </AlertDescription>
            </Alert>
            <Card>
              <CardBody>
                <FormControl>
                  <FormLabel fontSize="sm">Vault Emergency Actions</FormLabel>
                  <CheckboxGroup value={vaultActions} onChange={handleVaultActionChange}>
                    <Stack direction="row" spacing={4}>
                      <Checkbox value="pauseVault" colorScheme="red">
                        Pause Vault
                      </Checkbox>
                      <Checkbox value="pauseVaultBuffers" colorScheme="red">
                        Pause Vault Buffers
                      </Checkbox>
                    </Stack>
                  </CheckboxGroup>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Pause Vault: Halts all operations across all pools. Pause Vault Buffers: Halts
                    buffer operations only.
                  </Text>
                </FormControl>
              </CardBody>
            </Card>
            {vaultActions.length > 0 && (
              <Alert status="success" mt={4}>
                <AlertIcon />
                <AlertDescription>
                  ✓ Vault actions selected. You can generate the payload now or optionally add
                  specific pool actions below.
                </AlertDescription>
              </Alert>
            )}
          </GridItem>
        </Grid>
      )}

      {protocolVersion && selectedNetwork && (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
          <GridItem colSpan={12}>
            {/* Show pool selection heading and context based on protocol */}
            {protocolVersion === "v3" && vaultActions.length > 0 ? (
              <>
                <Heading as="h3" size="md" mb={4}>
                  Additional Pool Actions (Optional)
                </Heading>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <AlertDescription>
                    Optionally add specific pool actions to combine with your vault actions.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Heading as="h3" size="md" mb={4}>
                Select {protocolVersion.toUpperCase()} Pools
              </Heading>
            )}
          </GridItem>
          <GridItem colSpan={{ base: 12, md: 8 }}>
            <PoolSelector
              pools={availablePools}
              loading={loading}
              error={error}
              selectedPool={null}
              onPoolSelect={handlePoolSelect}
              onClearSelection={() => {}}
            />
          </GridItem>
        </Grid>
      )}

      {selectedPools.length > 0 && (
        <Box mb={6}>
          <Heading as="h3" size="md" mb={4}>
            Selected {protocolVersion?.toUpperCase()} Pools ({selectedPools.length})
          </Heading>
          <VStack spacing={4}>
            {selectedPools.map(pool => (
              <Card key={pool.address} w="100%">
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="bold" fontSize="md">
                          {pool.name}
                        </Text>
                        <Badge colorScheme={protocolVersion === "v3" ? "purple" : "blue"} size="sm">
                          {protocolVersion?.toUpperCase()}
                        </Badge>
                        {!pool.isV3Pool && pool.pauseMethod === "setPaused" && (
                          <Badge colorScheme="orange" size="sm">
                            Legacy
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="sm" color="gray.600" fontFamily="mono">
                        {pool.address}
                      </Text>
                    </Box>
                    <IconButton
                      aria-label="Remove pool"
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemovePool(pool.address)}
                    />
                  </Flex>
                </CardHeader>
                <CardBody pt={2}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">Emergency Actions</FormLabel>
                      <CheckboxGroup
                        value={pool.selectedActions}
                        onChange={values => handleActionChange(pool.address, values as string[])}
                      >
                        <Stack direction="row" spacing={4}>
                          <Checkbox value="pause" colorScheme="red">
                            Pause Pool
                          </Checkbox>
                          <Checkbox value="enableRecoveryMode" colorScheme="orange">
                            Enable Recovery Mode
                          </Checkbox>
                        </Stack>
                      </CheckboxGroup>
                    </FormControl>

                    {/* Individual pause method selection for V2 pools */}
                    {!pool.isV3Pool && pool.selectedActions.includes("pause") && (
                      <FormControl>
                        <FormLabel fontSize="sm">
                          <Flex align="center" gap={1}>
                            Pause Method for this Pool
                            <InfoIcon color="gray.500" />
                          </Flex>
                        </FormLabel>
                        <RadioGroup
                          value={pool.pauseMethod || "pause"}
                          onChange={(value: "pause" | "setPaused") =>
                            handlePauseMethodChange(pool.address, value)
                          }
                        >
                          <HStack spacing={6}>
                            <Radio value="pause" size="sm">
                              pause()
                            </Radio>
                            <Radio value="setPaused" size="sm">
                              setPaused(true)
                            </Radio>
                          </HStack>
                        </RadioGroup>
                      </FormControl>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>
      )}

      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        {!selectedPools.length && !vaultActions.length ? (
          <Button variant="primary" isDisabled={true} colorScheme="red">
            {!protocolVersion
              ? "Select Protocol Version"
              : !selectedNetwork
                ? "Select Network"
                : "Select Actions"}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            isDisabled={!emergencyWallet || !protocolVersion}
            colorScheme="red"
          >
            Generate Emergency Payload
          </Button>
        )}
        {generatedPayload && <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />}
      </Flex>

      <Divider />

      {generatedPayload && (
        <>
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={newJson => setGeneratedPayload(newJson)}
          />

          <Box display="flex" alignItems="center" mt="20px">
            <Button
              variant="secondary"
              mr="10px"
              leftIcon={<DownloadIcon />}
              onClick={() => handleDownloadClick(generatedPayload)}
            >
              Download Payload
            </Button>
            <Button
              variant="secondary"
              mr="10px"
              leftIcon={<CopyIcon />}
              onClick={() => copyJsonToClipboard(generatedPayload, toast)}
            >
              Copy Payload to Clipboard
            </Button>
            <OpenPRButton onClick={handleOpenPRModal} network={selectedNetwork} />
          </Box>

          {humanReadableText && (
            <Box mt={4}>
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Human-readable Summary
              </Text>
              <Box p={4} borderWidth="1px" borderRadius="lg" mb={3}>
                <Text whiteSpace="pre-line">{humanReadableText}</Text>
              </Box>
              <Button
                variant="secondary"
                leftIcon={<CopyIcon />}
                onClick={() => copyTextToClipboard(humanReadableText, toast)}
              >
                Copy Summary
              </Button>
            </Box>
          )}
        </>
      )}

      {generatedPayload && (
        <PRCreationModal
          type="emergency-actions"
          network={selectedNetwork}
          isOpen={isOpen}
          onClose={onClose}
          payload={generatedPayload ? JSON.parse(generatedPayload) : null}
          {...getPrefillValues()}
        />
      )}
    </Container>
  );
}
