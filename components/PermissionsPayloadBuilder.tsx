"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Select,
  SimpleGrid,
  Text,
  Card,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Checkbox,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { CopyIcon, DownloadIcon, SearchIcon } from "@chakra-ui/icons";
import { AddressBook } from "@/types/interfaces";
import { networks } from "@/constants/constants";
import { getCategoryData, getAddress } from "@/lib/data/maxis/addressBook";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { NetworkSelector } from "@/components/NetworkSelector";
import {
  copyJsonToClipboard,
  handleDownloadClick,
  generatePermissionsPayload,
  generateHumanReadablePermissions,
  transformToHumanReadable,
  PermissionInput,
} from "@/app/payload-builder/payloadHelperFunctions";

interface PermissionsPayloadBuilderProps {
  addressBook: AddressBook;
}

interface Permission {
  actionId: string;
  description: string;
  selected: boolean;
}

interface Permissions {
  [actionId: string]: string[] | { [address: string]: boolean };
}

interface ReverseAddressBook {
  [address: string]: string;
}

interface ActionIdsData {
  [deployment: string]: {
    [contract: string]: {
      useAdaptor: boolean;
      actionIds: {
        [functionName: string]: string;
      };
    };
  };
}

export default function PermissionsPayloadBuilder({ addressBook }: PermissionsPayloadBuilderProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);
  const [networkOptions, setNetworkOptions] = useState<
    Array<{ label: string; apiID: string; chainId: string }>
  >([]);
  const [availableWallets, setAvailableWallets] = useState<{ [key: string]: string }>({});
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [daoAddress, setDAOAddress] = useState<string>("");
  const [authorizerAdaptor, setAuthorizerAdaptor] = useState<string>("");
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);
  const [reverseAddressBook, setReverseAddressBook] = useState<ReverseAddressBook>({});
  const [actionIdDescriptions, setActionIdDescriptions] = useState<{ [actionId: string]: string }>(
    {},
  );
  const toast = useToast();

  // Initialize networks
  useEffect(() => {
    const availableNetworks = Object.keys(networks).filter(net => net !== "sonic" && net !== "bsc");
    setAvailableNetworks(availableNetworks);

    const options = availableNetworks.map(network => {
      return {
        label: network.charAt(0).toUpperCase() + network.slice(1),
        apiID: network,
        chainId: networks[network]?.chainId || "0",
      };
    });

    setNetworkOptions(options);

    if (availableNetworks.length > 0) {
      setSelectedNetwork(availableNetworks[0]);
    }
  }, [addressBook]);

  // Load wallets when network changes
  useEffect(() => {
    loadWallets();
  }, [selectedNetwork, addressBook]);

  // Load action IDs and reverse lookup on network change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([loadActionIds(), loadReverseLookup()]);
      setLoading(false);
    };

    fetchData();
  }, [selectedNetwork]);

  // Load permissions when wallet changes
  useEffect(() => {
    if (selectedWallet) {
      loadWalletPermissions();
    }
  }, [selectedWallet, selectedNetwork]);

  // Filter permissions based on search term - using useCallback to prevent excessive rerenders
  const filterPermissions = useCallback(() => {
    if (searchTerm.trim() === "") {
      setFilteredPermissions(allPermissions);
    } else {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const filtered = allPermissions.filter(
        permission =>
          permission.actionId.toLowerCase().includes(lowercasedSearchTerm) ||
          permission.description.toLowerCase().includes(lowercasedSearchTerm),
      );
      setFilteredPermissions(filtered);
    }
  }, [searchTerm, allPermissions]);

  // Apply the filter when search term or permissions change
  useEffect(() => {
    filterPermissions();
  }, [filterPermissions]);

  const loadWallets = () => {
    const multisigs = getCategoryData(addressBook, selectedNetwork, "multisigs");
    const formattedAddresses: { [key: string]: string } = {};

    if (multisigs && typeof multisigs === "object") {
      Object.entries(multisigs).forEach(([key, value]) => {
        if (typeof value === "string") {
          formattedAddresses[`multisig.${key}`] = value;
        } else if (typeof value === "object" && value !== null) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            formattedAddresses[`multisig.${key}.${nestedKey}`] = nestedValue;
          });
        }
      });
    }
    const authorizer = getAddress(
      addressBook,
      selectedNetwork,
      "20210418-authorizer",
      "Authorizer",
    );
    const daoWallet = getAddress(addressBook, selectedNetwork, "multisigs", "dao");

    setAuthorizerAdaptor(authorizer ? authorizer : "");
    setDAOAddress(daoWallet ? daoWallet : "");
    setAvailableWallets(formattedAddresses);
    setSelectedWallet("");
  };

  const loadReverseLookup = async () => {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/BalancerMaxis/bal_addresses/main/outputs/${selectedNetwork}_reverse.json`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reverse lookup data: ${response.statusText}`);
      }

      const data = await response.json();
      setReverseAddressBook(data);
      return true;
    } catch (error) {
      console.error("Error loading reverse lookup:", error);
      toast({
        title: "Error loading reverse lookup",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  };

  const loadActionIds = async () => {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/balancer/balancer-deployments/master/action-ids/${selectedNetwork}/action-ids.json`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch action IDs: ${response.statusText}`);
      }

      const data = (await response.json()) as ActionIdsData;

      // Transform the data
      const permissionsArray: Permission[] = [];
      const descriptionsMap: { [actionId: string]: string } = {};

      for (const [deployment, contracts] of Object.entries(data)) {
        for (const [contract, contractData] of Object.entries(contracts)) {
          if (contractData.actionIds) {
            for (const [functionName, actionId] of Object.entries(contractData.actionIds)) {
              // Only add if not already in the array (avoid duplicates)
              if (!descriptionsMap[actionId]) {
                permissionsArray.push({
                  actionId,
                  description: `${contract}.${functionName}`,
                  selected: false,
                });

                descriptionsMap[actionId] = `${contract}.${functionName}`;
              }
            }
          }
        }
      }

      setAllPermissions(permissionsArray);
      setFilteredPermissions(permissionsArray);
      setActionIdDescriptions(descriptionsMap);
      return true;
    } catch (error) {
      console.error("Error loading action IDs:", error);
      toast({
        title: "Error loading action IDs",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  };

  const loadWalletPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await fetch(
        `https://raw.githubusercontent.com/BalancerMaxis/bal_addresses/main/outputs/permissions/active/${selectedNetwork}.json`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.statusText}`);
      }

      const data = (await response.json()) as Permissions;

      // Find permissions for selected wallet
      const walletPermissions: string[] = [];

      for (const [actionId, addresses] of Object.entries(data)) {
        // Handle both data formats
        if (Array.isArray(addresses)) {
          // Format 1: actionId -> array of addresses
          if (addresses.some(addr => addr.toLowerCase() === selectedWallet.toLowerCase())) {
            walletPermissions.push(actionId);
          }
        } else if (typeof addresses === "object") {
          // Format 2: actionId -> { address: boolean }
          if (
            addresses[selectedWallet.toLowerCase()] === true ||
            addresses[selectedWallet] === true
          ) {
            walletPermissions.push(actionId);
          }
        }
      }

      setCurrentPermissions(walletPermissions);
    } catch (error) {
      console.error("Error loading wallet permissions:", error);
      toast({
        title: "Error loading wallet permissions",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
    setSelectedWallet("");
    setCurrentPermissions([]);
    setSelectedPermissions([]);
    setGeneratedPayload(null);
    setHumanReadableText(null);
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWallet(e.target.value);
    setSelectedPermissions([]);
    setGeneratedPayload(null);
    setHumanReadableText(null);
  };

  const handlePermissionToggle = (actionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };

  const removeSelectedPermission = (actionId: string) => {
    setSelectedPermissions(prev => prev.filter(id => id !== actionId));
  };

  const getPermissionDescription = (actionId: string) => {
    return actionIdDescriptions[actionId] || actionId;
  };

  const generatePayload = () => {
    if (selectedPermissions.length === 0) {
      toast({
        title: "No permissions selected",
        description: "Please select at least one permission to generate a payload",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Get chain ID for the selected network
    const chainId = networkOptions.find(opt => opt.apiID === selectedNetwork)?.chainId || "1";

    // Prepare input for payload generator
    const permissionInput: PermissionInput = {
      actionIds: selectedPermissions,
      granteeAddress: selectedWallet,
      granterAddress: daoAddress,
      authorizerAddress: authorizerAdaptor,
      network: selectedNetwork,
      chainId: chainId,
    };

    // Generate payload using helper function
    const payload = generatePermissionsPayload(permissionInput);
    setGeneratedPayload(payload);

    // Generate human readable text
    const walletName =
      Object.entries(availableWallets).find(([_, address]) => address === selectedWallet)?.[0] ||
      selectedWallet;
    const readableWalletName = transformToHumanReadable(walletName);

    const humanReadable = generateHumanReadablePermissions(
      selectedPermissions,
      actionIdDescriptions,
      selectedWallet,
      readableWalletName,
    );

    setHumanReadableText(humanReadable);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Function to truncate Ethereum addresses
  const truncateAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Container maxW="container.lg">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Create Permissions Payload
        </Heading>
        <Text mb={4}>Build a payload to grant permissions to a wallet address.</Text>
      </Box>

      <Box>
        <Box mb={2} mt={2}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl maxWidth="sm">
              <FormLabel>Select Network</FormLabel>
              <NetworkSelector
                networks={networks}
                networkOptions={networkOptions}
                selectedNetwork={selectedNetwork}
                handleNetworkChange={handleNetworkChange}
              />
            </FormControl>

            <FormControl maxWidth="sm">
              <FormLabel>Select Wallet</FormLabel>
              <Select
                value={selectedWallet}
                onChange={handleWalletChange}
                placeholder="Select wallet"
                isDisabled={loading}
              >
                {Object.entries(availableWallets).map(([name, address]) => (
                  <option key={`${name}-${address}`} value={address}>
                    {`${transformToHumanReadable(name)} (${truncateAddress(address)})`}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
        </Box>

        {selectedWallet && (
          <Card p={4} mb={4} overflowX="auto">
            <Heading as="h3" size="md" mb={4}>
              Current Permissions
            </Heading>
            {permissionsLoading ? (
              <Flex justify="center" align="center" p={4}>
                <Spinner />
              </Flex>
            ) : (
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Permission</Th>
                      <Th>Action ID</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentPermissions.length > 0 ? (
                      currentPermissions.map((permission, index) => (
                        <Tr key={`current-${index}-${permission.substring(0, 8)}`}>
                          <Td>{getPermissionDescription(permission)}</Td>
                          <Td>
                            <Text as="span" fontSize="xs" fontFamily="monospace">
                              {permission.substring(0, 18)}...
                            </Text>
                          </Td>
                          <Td>
                            {!selectedPermissions.includes(permission) && (
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handlePermissionToggle(permission)}
                              >
                                Add
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={3} textAlign="center">
                          No permissions found for this wallet
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {selectedWallet && (
          <Card p={4} mb={4}>
            <Heading as="h3" size="md" mb={2}>
              Selected Permissions
            </Heading>
            <Box mb={4}>
              {selectedPermissions.length > 0 ? (
                <Flex flexWrap="wrap" gap={2}>
                  {selectedPermissions.map((permission, index) => (
                    <Tag
                      key={`selected-${index}-${permission.substring(0, 8)}`}
                      colorScheme="green"
                      size="md"
                      borderRadius="full"
                      mb={1}
                    >
                      <TagLabel title={permission}>{getPermissionDescription(permission)}</TagLabel>
                      <TagCloseButton onClick={() => removeSelectedPermission(permission)} />
                    </Tag>
                  ))}
                </Flex>
              ) : (
                <Text>No permissions selected yet. Search and select permissions below.</Text>
              )}
            </Box>

            <Box>
              <FormControl mb={4}>
                <FormLabel>Search Permissions</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name or action ID"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </FormControl>

              <Box maxH="300px" overflowY="auto">
                {loading ? (
                  <Flex justify="center" align="center" p={4}>
                    <Spinner />
                  </Flex>
                ) : (
                  <Stack spacing={2}>
                    {filteredPermissions.map((permission, index) => (
                      <Checkbox
                        key={`filter-${index}-${permission.actionId.substring(0, 8)}`}
                        isChecked={selectedPermissions.includes(permission.actionId)}
                        onChange={() => handlePermissionToggle(permission.actionId)}
                        colorScheme="green"
                      >
                        <Text fontSize="sm">
                          {permission.description}
                          <Text as="span" color="gray.500" ml={1} fontSize="xs">
                            ({permission.actionId.substring(0, 10)}...)
                          </Text>
                        </Text>
                      </Checkbox>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </Card>
        )}
      </Box>

      {selectedWallet && (
        <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
          <Button
            variant="primary"
            onClick={generatePayload}
            isDisabled={loading || selectedPermissions.length === 0}
          >
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
        </Flex>
      )}

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
              leftIcon={<CopyIcon />}
              onClick={() => copyJsonToClipboard(generatedPayload, toast)}
            >
              Copy Payload to Clipboard
            </Button>
          </Box>

          {humanReadableText && (
            <Box mt="20px">
              <Text fontSize="2xl">Human-readable Text</Text>
              <Box p="20px" mb="20px" borderWidth="1px" borderRadius="lg">
                <Text whiteSpace="pre-line">{humanReadableText}</Text>
              </Box>
              <Button
                variant="secondary"
                leftIcon={<CopyIcon />}
                onClick={() => {
                  if (humanReadableText) {
                    navigator.clipboard
                      .writeText(humanReadableText)
                      .then(() => {
                        toast({
                          title: "Copied to clipboard!",
                          status: "success",
                          duration: 2000,
                          isClosable: true,
                        });
                      })
                      .catch(err => {
                        console.error("Could not copy text: ", err);
                      });
                  }
                }}
              >
                Copy Text to Clipboard
              </Button>
            </Box>
          )}
        </>
      )}

      <Box mt={8} />
    </Container>
  );
}
