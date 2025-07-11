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
import { getV3PoolFactoriesForNetwork, V3PoolFactory } from "@/lib/utils/getV3PoolFactories";
import {
  DeprecatedPoolFactory,
  getDeprecatedPoolFactoriesForNetwork,
} from "@/lib/utils/getDeprecatedPoolFactories";

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
  const [vaultActions, setVaultActions] = useState<("pauseVault" | "pauseVaultBuffers")[]>([]); // For V3 vault-level actions
  const [selectedFactories, setSelectedFactories] = useState<V3PoolFactory[]>([]); // For V3 factory disable actions
  const [selectedDeprecatedFactories, setSelectedDeprecatedFactories] = useState<
    DeprecatedPoolFactory[]
  >([]); // For deprecated factory disable actions
  const [includeDeprecated, setIncludeDeprecated] = useState<boolean>(false); // Toggle for showing deprecated factories

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

  // Get available V3 factories for the selected network
  const availableFactories = useMemo(() => {
    if (protocolVersion !== "v3" || !selectedNetwork) return [];
    const factories = getV3PoolFactoriesForNetwork(addressBook, selectedNetwork);
    console.log("Available factories for", selectedNetwork, ":", factories);
    return factories;
  }, [protocolVersion, selectedNetwork, addressBook]);

  // Get deprecated factories for the selected network
  const [deprecatedFactories, setDeprecatedFactories] = useState<DeprecatedPoolFactory[]>([]);
  const [loadingDeprecated, setLoadingDeprecated] = useState(false);

  // Fetch deprecated factories when network changes and deprecated toggle is enabled
  useEffect(() => {
    if (protocolVersion !== "v3" || !selectedNetwork || !includeDeprecated) {
      setDeprecatedFactories([]);
      return;
    }

    const fetchDeprecatedFactories = async () => {
      setLoadingDeprecated(true);
      try {
        const factories = await getDeprecatedPoolFactoriesForNetwork(
          selectedNetwork,
          protocolVersion,
        );
        setDeprecatedFactories(factories);
      } catch (error) {
        console.error("Error fetching deprecated factories:", error);
        setDeprecatedFactories([]);
      } finally {
        setLoadingDeprecated(false);
      }
    };

    fetchDeprecatedFactories();
  }, [protocolVersion, selectedNetwork, includeDeprecated]);

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
    setSelectedFactories([]);
    setSelectedDeprecatedFactories([]);
    setGeneratedPayload(null);
    setHumanReadableText(null);
  }, []);

  const handleNetworkChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedPools([]);
    setVaultActions([]);
    setSelectedFactories([]);
    setSelectedDeprecatedFactories([]);
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
            pauseMethod: isV3Pool ? undefined : "pause", // Default to "pause" for V2 pools
          },
        ];
      });
    },
    [protocolVersion],
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

  const handleFactorySelect = useCallback((factory: V3PoolFactory) => {
    setSelectedFactories(prev => {
      // Check if factory is already selected
      const existingIndex = prev.findIndex(f => f.address === factory.address);
      if (existingIndex >= 0) {
        return prev; // Factory already selected
      }
      return [...prev, factory];
    });
  }, []);

  const handleRemoveFactory = useCallback((factoryAddress: string) => {
    setSelectedFactories(prev => prev.filter(f => f.address !== factoryAddress));
  }, []);

  const handleDeprecatedFactorySelect = useCallback((factory: DeprecatedPoolFactory) => {
    setSelectedDeprecatedFactories(prev => {
      // Check if factory is already selected
      const existingIndex = prev.findIndex(f => f.address === factory.address);
      if (existingIndex >= 0) {
        return prev; // Factory already selected
      }
      return [...prev, factory];
    });
  }, []);

  const handleRemoveDeprecatedFactory = useCallback((factoryAddress: string) => {
    setSelectedDeprecatedFactories(prev => prev.filter(f => f.address !== factoryAddress));
  }, []);

  const handlePauseMethodChange = useCallback(
    (poolAddress: string, method: "pause" | "setPaused") => {
      setSelectedPools(prev =>
        prev.map(pool => (pool.address === poolAddress ? { ...pool, pauseMethod: method } : pool)),
      );
    },
    [],
  );

  const handleGenerateClick = useCallback(() => {
    if (
      selectedPools.length === 0 &&
      vaultActions.length === 0 &&
      selectedFactories.length === 0 &&
      selectedDeprecatedFactories.length === 0
    ) {
      toast({
        title: "No actions selected",
        description:
          "Please select at least one pool action, vault action, or factory disable action for emergency actions",
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
      factoryActions:
        protocolVersion === "v3"
          ? [
              ...selectedFactories.map(f => ({ address: f.address, name: f.displayName })),
              ...selectedDeprecatedFactories.map(f => ({
                address: f.address,
                name: f.displayName,
              })),
            ]
          : [],
    };

    const payload = generateEmergencyPayload(payloadInput);
    const humanReadable = generateHumanReadableEmergency(payloadInput);

    setGeneratedPayload(JSON.stringify(payload, null, 2));
    setHumanReadableText(humanReadable);
  }, [
    selectedPools,
    vaultActions,
    selectedFactories,
    selectedDeprecatedFactories,
    emergencyWallet,
    selectedNetwork,
    addressBook,
    protocolVersion,
  ]);

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
    if (
      (selectedPools.length === 0 &&
        vaultActions.length === 0 &&
        selectedFactories.length === 0 &&
        selectedDeprecatedFactories.length === 0) ||
      !protocolVersion
    )
      return {};

    const uniqueId = generateUniqueId();
    selectedPools.length > 0 ? selectedPools[0].address.substring(0, 8) : "vault";
    // Count total actions
    const poolActions = selectedPools.reduce((sum, pool) => sum + pool.selectedActions.length, 0);
    const totalActions =
      poolActions +
      vaultActions.length +
      selectedFactories.length +
      selectedDeprecatedFactories.length;

    // Get network name
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const networkName = networkOption?.label || selectedNetwork;
    const networkPath = networkName === "Ethereum" ? "Mainnet" : networkName;

    // Generate description
    const descriptions = [];
    if (selectedPools.length > 0) {
      descriptions.push(
        `${selectedPools.length} ${protocolVersion} pool${selectedPools.length !== 1 ? "s" : ""}`,
      );
    }
    if (vaultActions.length > 0) {
      descriptions.push(
        `${vaultActions.length} vault action${vaultActions.length !== 1 ? "s" : ""}`,
      );
    }
    const totalFactoryActions = selectedFactories.length + selectedDeprecatedFactories.length;
    if (totalFactoryActions > 0) {
      descriptions.push(
        `${totalFactoryActions} factory disable action${totalFactoryActions !== 1 ? "s" : ""}`,
      );
    }

    const actionType =
      selectedFactories.length > 0 || selectedDeprecatedFactories.length > 0
        ? "mixed"
        : selectedPools.length > 0
          ? "pools"
          : "vault";
    const filename =
      networkPath + `/emergency-actions-${protocolVersion}-${actionType}-${uniqueId}.json`;

    return {
      prefillBranchName: `emergency/${protocolVersion}-${actionType}-${uniqueId}`,
      prefillPrName: `Emergency Actions for ${protocolVersion.toUpperCase()} on ${networkName}`,
      prefillDescription: `Emergency actions: ${totalActions} total action${totalActions !== 1 ? "s" : ""} (${descriptions.join(", ")}) on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [
    selectedPools,
    vaultActions,
    selectedFactories,
    selectedDeprecatedFactories,
    selectedNetwork,
    protocolVersion,
  ]);

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={4}>
        Emergency Actions Payload Builder
      </Heading>

      <Text fontSize="md" color="font.secondary" mb={6}>
        Create emergency payloads for pool pausing, recovery mode, vault actions, and factory
        disabling. These actions can be executed by the Emergency SubDAO wallet during critical
        situations.
      </Text>

      <Alert status="warning" mb={6} py={4} variant="left-accent" borderRadius="md">
        <Box flex="1">
          <Flex align="center">
            <AlertIcon boxSize="20px" />
            <AlertTitle fontSize="lg" ml={2}>
              Emergency SubDAO Actions
            </AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <Text fontSize="sm" mb={3}>
              This tool creates payloads for emergency actions that can be executed by the Emergency
              SubDAO wallet. Use these actions only in genuine emergency situations.
            </Text>
            <List spacing={2} fontSize="sm">
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="orange.500" />
                <strong>Pause Pool/Vault:</strong> Immediately stops all operations (swaps, adds,
                removes)
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="orange.500" />
                <strong>Enable Recovery Mode:</strong> Allows proportional withdrawals only, no
                trading
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="orange.500" />
                <strong>Disable Factory:</strong> Permanently prevents new pool deployments from
                specific factories
              </ListItem>
              <ListItem>
                <ListIcon as={WarningIcon} color="red.500" />
                <strong>Important:</strong> These actions should only be used during actual
                emergencies
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
          <Text fontSize="sm" color="font.secondary" mb={4}>
            Choose the Balancer protocol version for your emergency actions. This determines which
            networks and action types are available.
          </Text>
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme={protocolVersion === "v2" ? "blue" : "gray"}
              variant={protocolVersion === "v2" ? "solid" : "outline"}
              onClick={() => handleProtocolVersionChange("v2")}
              leftIcon={<Badge colorScheme="blue">V2</Badge>}
            >
              Balancer v2
            </Button>
            <Button
              size="lg"
              colorScheme={protocolVersion === "v3" ? "purple" : "gray"}
              variant={protocolVersion === "v3" ? "solid" : "outline"}
              onClick={() => handleProtocolVersionChange("v3")}
              leftIcon={<Badge colorScheme="purple">V3</Badge>}
            >
              Balancer v3
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

      {protocolVersion && (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
          <GridItem colSpan={{ base: 12, md: 4 }}>
            <NetworkSelector
              networks={networks}
              networkOptions={availableNetworkOptions}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
              label="Select Network"
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

      {protocolVersion && selectedNetwork && (
        <Box mb={6}>
          <Heading as="h3" size="md" mb={4}>
            Emergency Actions
          </Heading>
          <Text fontSize="sm" color="font.secondary" mb={6}>
            Select the emergency actions to include in your payload. You can combine multiple action
            types.
          </Text>
        </Box>
      )}

      {protocolVersion === "v3" && selectedNetwork && (
        <Card mb={6}>
          <CardBody>
            <Heading as="h4" size="sm" mb={4}>
              🔒 Vault Actions (affects all pools)
            </Heading>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <AlertDescription>
                <Text fontWeight="bold" mb={1}>
                  🔒 Vault-Level Actions
                </Text>
                <Text fontSize="sm">
                  These actions affect the entire V3 vault on {selectedNetwork}. No specific pool
                  selection needed - they will impact all pools in the vault.
                </Text>
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
                  <Text fontSize="xs" color="font.secondary" mt={2}>
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
          </CardBody>
        </Card>
      )}

      {protocolVersion === "v3" && selectedNetwork && (
        <Card mb={6}>
          <CardBody>
            <Heading as="h4" size="sm" mb={4}>
              Factory Actions (disable new pool creation)
            </Heading>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <AlertDescription>
                <Text fontWeight="bold" mb={1}>
                  Factory Disable Actions
                </Text>
                <Text fontSize="sm">
                  Disable pool factories to prevent creation of new pools of specific types. This
                  action is <strong>irreversible</strong> and will permanently stop new pool
                  deployments from these factories.
                </Text>
              </AlertDescription>
            </Alert>
            <Card>
              <CardBody>
                <FormControl>
                  <FormLabel fontSize="sm">Available Pool Factories</FormLabel>
                  {availableFactories.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      <AlertDescription>
                        No V3 pool factories found for {selectedNetwork}. Network: {selectedNetwork}
                        , Protocol: {protocolVersion}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {availableFactories.map(factory => (
                        <Flex
                          key={factory.address}
                          justify="space-between"
                          align="center"
                          p={2}
                          borderWidth="1px"
                          borderRadius="md"
                        >
                          <Box>
                            <Text fontWeight="medium">{factory.displayName}</Text>
                            <Text fontSize="xs" color="font.secondary" fontFamily="mono">
                              {factory.address}
                            </Text>
                          </Box>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleFactorySelect(factory)}
                            isDisabled={selectedFactories.some(f => f.address === factory.address)}
                          >
                            {selectedFactories.some(f => f.address === factory.address)
                              ? "Selected"
                              : "Select"}
                          </Button>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </FormControl>
              </CardBody>
            </Card>

            {/* Deprecated Factories Toggle */}
            <Card mt={4}>
              <CardBody>
                <FormControl>
                  <Checkbox
                    isChecked={includeDeprecated}
                    onChange={e => setIncludeDeprecated(e.target.checked)}
                    colorScheme="orange"
                  >
                    <Text fontWeight="medium">Include Deprecated Pool Factories</Text>
                  </Checkbox>
                  <Text fontSize="xs" color="font.secondary" mt={1}>
                    Show deprecated pool factories that can also be disabled for emergency purposes.
                    These are older factory versions that may still be functional but are no longer
                    officially supported.
                  </Text>
                </FormControl>
              </CardBody>
            </Card>

            {/* Deprecated Factories List */}
            {includeDeprecated && (
              <Card mt={4}>
                <CardBody>
                  <FormControl>
                    <FormLabel fontSize="sm">Deprecated Pool Factories</FormLabel>
                    {loadingDeprecated ? (
                      <Alert status="info">
                        <AlertIcon />
                        <AlertDescription>Loading deprecated factories...</AlertDescription>
                      </Alert>
                    ) : deprecatedFactories.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        <AlertDescription>
                          No deprecated pool factories found for {selectedNetwork}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {deprecatedFactories.map(factory => (
                          <Flex
                            key={factory.address}
                            justify="space-between"
                            align="center"
                            p={2}
                            borderWidth="1px"
                            borderRadius="md"
                          >
                            <Box>
                              <Flex align="center" gap={2}>
                                <Text fontWeight="medium">{factory.displayName}</Text>
                                <Badge colorScheme="orange" size="sm">
                                  DEPRECATED
                                </Badge>
                              </Flex>
                              <Text fontSize="xs" color="font.secondary" fontFamily="mono">
                                {factory.address}
                              </Text>
                              <Text fontSize="xs" color="font.secondary">
                                Deployment: {factory.deployment}
                              </Text>
                            </Box>
                            <Button
                              size="sm"
                              colorScheme="orange"
                              variant="outline"
                              onClick={() => handleDeprecatedFactorySelect(factory)}
                              isDisabled={selectedDeprecatedFactories.some(
                                f => f.address === factory.address,
                              )}
                            >
                              {selectedDeprecatedFactories.some(f => f.address === factory.address)
                                ? "Selected"
                                : "Select"}
                            </Button>
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </FormControl>
                </CardBody>
              </Card>
            )}
            {(selectedFactories.length > 0 || selectedDeprecatedFactories.length > 0) && (
              <Alert status="success" mt={4}>
                <AlertIcon />
                <AlertDescription>
                  ✓ {selectedFactories.length + selectedDeprecatedFactories.length} factory
                  {selectedFactories.length + selectedDeprecatedFactories.length !== 1
                    ? "ies"
                    : "y"}{" "}
                  selected for disable action
                  {selectedFactories.length > 0 &&
                    selectedDeprecatedFactories.length > 0 &&
                    ` (${selectedFactories.length} active, ${selectedDeprecatedFactories.length} deprecated)`}
                  {selectedFactories.length > 0 &&
                    selectedDeprecatedFactories.length === 0 &&
                    ` (${selectedFactories.length} active)`}
                  {selectedFactories.length === 0 &&
                    selectedDeprecatedFactories.length > 0 &&
                    ` (${selectedDeprecatedFactories.length} deprecated)`}
                  .
                </AlertDescription>
              </Alert>
            )}
          </CardBody>
        </Card>
      )}

      {protocolVersion && selectedNetwork && (
        <Card mb={6}>
          <CardBody>
            {/* Show pool selection heading and context based on protocol */}
            {protocolVersion === "v3" && vaultActions.length > 0 ? (
              <>
                <Heading as="h4" size="sm" mb={4}>
                  🏊 Additional Pool Actions (Optional)
                </Heading>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <AlertDescription>
                    Optionally add specific pool actions to combine with your vault actions.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Heading as="h4" size="sm" mb={4}>
                🏊 Pool Actions (affects individual pools)
              </Heading>
            )}
            <PoolSelector
              pools={availablePools}
              loading={loading}
              error={error}
              selectedPool={null}
              onPoolSelect={handlePoolSelect}
              onClearSelection={() => {}}
            />
          </CardBody>
        </Card>
      )}

      {selectedPools.length > 0 && (
        <Box mb={6}>
          <Heading as="h4" size="sm" mb={4}>
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
                      <Text fontSize="sm" color="font.secondary" fontFamily="mono">
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
                            <InfoIcon color="font.secondary" />
                          </Flex>
                        </FormLabel>
                        <RadioGroup
                          value={pool.pauseMethod || "pause"}
                          onChange={(value: "pause" | "setPaused") =>
                            handlePauseMethodChange(pool.address, value)
                          }
                        >
                          <VStack align="start" spacing={2}>
                            <Radio value="pause" size="sm">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  pause() - Modern V2 Pools
                                </Text>
                                <Text fontSize="xs" color="font.secondary">
                                  Use for newer Balancer v2 pools (most common)
                                </Text>
                              </VStack>
                            </Radio>
                            <Radio value="setPaused" size="sm">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  setPaused(true) - Legacy V2 Pools
                                </Text>
                                <Text fontSize="xs" color="font.secondary">
                                  Use for older pools that don't have the pause() method
                                </Text>
                              </VStack>
                            </Radio>
                          </VStack>
                        </RadioGroup>
                        <Text fontSize="xs" color="font.secondary" mt={2}>
                          <strong>Not sure which to use?</strong> Try pause() first (default). If
                          the transaction fails, switch to setPaused(true).
                        </Text>
                      </FormControl>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>
      )}

      {selectedFactories.length > 0 && (
        <Box mb={6}>
          <Heading as="h4" size="sm" mb={4}>
            Selected V3 Factories for Disable ({selectedFactories.length})
          </Heading>
          <VStack spacing={3}>
            {selectedFactories.map(factory => (
              <Card key={factory.address} w="100%">
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="bold" fontSize="md">
                          {factory.displayName}
                        </Text>
                        <Badge colorScheme="red" size="sm">
                          DISABLE
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" color="font.secondary" fontFamily="mono">
                        {factory.address}
                      </Text>
                      <Text fontSize="xs" color="font.secondary">
                        Category: {factory.category}
                      </Text>
                    </Box>
                    <IconButton
                      aria-label="Remove factory"
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemoveFactory(factory.address)}
                    />
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>
      )}

      {selectedDeprecatedFactories.length > 0 && (
        <Box mb={6}>
          <Heading as="h4" size="sm" mb={4}>
            Selected Deprecated Factories for Disable ({selectedDeprecatedFactories.length})
          </Heading>
          <VStack spacing={3}>
            {selectedDeprecatedFactories.map(factory => (
              <Card key={factory.address} w="100%">
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="bold" fontSize="md">
                          {factory.displayName}
                        </Text>
                        <Badge colorScheme="orange" size="sm">
                          DEPRECATED
                        </Badge>
                        <Badge colorScheme="red" size="sm">
                          DISABLE
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" color="font.secondary" fontFamily="mono">
                        {factory.address}
                      </Text>
                      <Text fontSize="xs" color="font.secondary">
                        Deployment: {factory.deployment}
                      </Text>
                    </Box>
                    <IconButton
                      aria-label="Remove deprecated factory"
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="orange"
                      onClick={() => handleRemoveDeprecatedFactory(factory.address)}
                    />
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>
      )}

      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        {!selectedPools.length &&
        !vaultActions.length &&
        !selectedFactories.length &&
        !selectedDeprecatedFactories.length ? (
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
