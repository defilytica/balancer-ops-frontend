"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
import { NETWORK_OPTIONS, networks, V3_VAULT_ADDRESS } from "@/constants/constants";
import {
  GetV3PoolsDocument,
  GetV3PoolsQuery,
  GetV3PoolsQueryVariables,
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
}

interface EmergencyPayloadBuilderProps {
  addressBook: AddressBook;
}

export default function EmergencyPayloadBuilder({ addressBook }: EmergencyPayloadBuilderProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPools, setSelectedPools] = useState<SelectedPool[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const [emergencyWallet, setEmergencyWallet] = useState<string>("");

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get V3 networks (emergency actions are primarily for V3)
  const networkOptionsWithV3 = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    return NETWORK_OPTIONS.filter(
      network => networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
    );
  }, [addressBook]);

  const { loading, error, data } = useQuery<GetV3PoolsQuery, GetV3PoolsQueryVariables>(
    GetV3PoolsDocument,
    {
      variables: { chainIn: [selectedNetwork as any] },
      skip: !selectedNetwork,
    },
  );

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

  const handleNetworkChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedPools([]);
    setGeneratedPayload(null);
    setHumanReadableText(null);
  }, []);

  const handlePoolSelect = useCallback((pool: Pool) => {
    setSelectedPools(prev => {
      // Check if pool is already selected
      const existingIndex = prev.findIndex(p => p.address === pool.address);
      if (existingIndex >= 0) {
        return prev; // Pool already selected
      }

      // Add pool with default actions
      return [...prev, { ...pool, selectedActions: ["pause"] }];
    });
  }, []);

  const handleRemovePool = useCallback((poolAddress: string) => {
    setSelectedPools(prev => prev.filter(p => p.address !== poolAddress));
  }, []);

  const handleActionChange = useCallback((poolAddress: string, actions: string[]) => {
    setSelectedPools(prev =>
      prev.map(pool =>
        pool.address === poolAddress
          ? { ...pool, selectedActions: actions as ("pause" | "enableRecoveryMode")[] }
          : pool,
      ),
    );
  }, []);

  const handleGenerateClick = useCallback(() => {
    if (selectedPools.length === 0) {
      toast({
        title: "No pools selected",
        description: "Please select at least one pool for emergency actions",
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

    // Get vault address for V3 operations
    const vaultAddress = getAddress(
      addressBook,
      selectedNetwork.toLowerCase(),
      "20241204-v3-vault",
      "Vault",
    );

    const emergencyActions: EmergencyActionInput[] = selectedPools
      .filter(pool => pool.selectedActions.length > 0)
      .map(pool => ({
        poolAddress: pool.address,
        poolName: pool.name,
        actions: pool.selectedActions,
        isV3Pool: true, // Assuming V3 for now
      }));

    const payloadInput: EmergencyPayloadInput = {
      pools: emergencyActions,
      emergencyWallet,
      chainId: networkOption.chainId,
      vaultAddress,
    };

    const payload = generateEmergencyPayload(payloadInput);
    const humanReadable = generateHumanReadableEmergency(payloadInput);

    setGeneratedPayload(JSON.stringify(payload, null, 2));
    setHumanReadableText(humanReadable);
  }, [selectedPools, emergencyWallet, selectedNetwork, addressBook]);

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
    if (selectedPools.length === 0) return {};

    const uniqueId = generateUniqueId();
    const firstPoolId = selectedPools[0].address.substring(0, 8);

    // Count total actions
    const totalActions = selectedPools.reduce((sum, pool) => sum + pool.selectedActions.length, 0);

    // Get network name
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const networkName = networkOption?.label || selectedNetwork;
    const networkPath = networkName === "Ethereum" ? "Mainnet" : networkName;

    const filename = networkPath + `/emergency-actions-${firstPoolId}-${uniqueId}.json`;

    return {
      prefillBranchName: `emergency/pools-${firstPoolId}-${uniqueId}`,
      prefillPrName: `Emergency Actions for ${selectedPools.length} Pool${selectedPools.length !== 1 ? "s" : ""} on ${networkName}`,
      prefillDescription: `Emergency actions: ${totalActions} action${totalActions !== 1 ? "s" : ""} across ${selectedPools.length} pool${selectedPools.length !== 1 ? "s" : ""} on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [selectedPools, selectedNetwork]);

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
                <strong>Pause Pool:</strong> Immediately stops all operations on the selected pool
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
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <NetworkSelector
            networks={networks}
            networkOptions={networkOptionsWithV3}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          {selectedNetwork && (
            <PoolSelector
              pools={data?.poolGetPools}
              loading={loading}
              error={error}
              selectedPool={null}
              onPoolSelect={handlePoolSelect}
              onClearSelection={() => {}}
            />
          )}
        </GridItem>
      </Grid>

      {emergencyWallet && (
        <Card mb={6}>
          <CardBody>
            <Text fontSize="sm" color="gray.600" mb={1}>
              Emergency Wallet
            </Text>
            <Text fontFamily="mono" fontSize="sm">
              {emergencyWallet}
            </Text>
          </CardBody>
        </Card>
      )}

      {selectedPools.length > 0 && (
        <Box mb={6}>
          <Heading as="h3" size="md" mb={4}>
            Selected Pools ({selectedPools.length})
          </Heading>
          <VStack spacing={4}>
            {selectedPools.map(pool => (
              <Card key={pool.address} w="100%">
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold" fontSize="md">
                        {pool.name}
                      </Text>
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
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>
      )}

      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        <Button
          variant="primary"
          onClick={handleGenerateClick}
          isDisabled={selectedPools.length === 0 || !emergencyWallet}
          colorScheme="red"
        >
          Generate Emergency Payload
        </Button>
        {generatedPayload && <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />}
      </Flex>

      <Divider />

      {generatedPayload && (
        <>
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={newJson => setGeneratedPayload(newJson)}
          />

          <Flex mt={4} mb={4} gap={2}>
            <Button
              variant="secondary"
              leftIcon={<DownloadIcon />}
              onClick={() => handleDownloadClick(generatedPayload)}
            >
              Download Payload
            </Button>
            <Button
              variant="secondary"
              leftIcon={<CopyIcon />}
              onClick={() => copyJsonToClipboard(generatedPayload, toast)}
            >
              Copy Payload
            </Button>
            <OpenPRButton onClick={handleOpenPRModal} />
          </Flex>

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

      <Box mt={8} />
      <PRCreationModal
        type="emergency-actions"
        network={selectedNetwork}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
        {...getPrefillValues()}
      />
    </Container>
  );
}
