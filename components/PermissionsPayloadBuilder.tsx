"use client";
import React, { useEffect, useState, useCallback, useMemo, useReducer, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Switch,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { CopyIcon, DownloadIcon, SearchIcon, ViewIcon, HamburgerIcon } from "@chakra-ui/icons";
import { FixedSizeList as List } from "react-window";
import { AddressBook } from "@/types/interfaces";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import { getCategoryData, getAddress } from "@/lib/data/maxis/addressBook";
import SimulateTransactionButton, { BatchFile } from "@/components/btns/SimulateTransactionButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { NetworkSelector } from "@/components/NetworkSelector";
import SearchableAddressInput from "@/components/SearchableAddressInput";
import PermissionsTable from "@/components/tables/PermissionsTable";
import GroupedPermissionsList from "./GroupedPermissionsList";
import {
  copyJsonToClipboard,
  handleDownloadClick,
  generatePermissionsPayload,
  generateHumanReadablePermissions,
  transformToHumanReadable,
  PermissionInput,
} from "@/app/payload-builder/payloadHelperFunctions";

export interface Permission {
  actionId: string;
  description: string;
  deployment: string;
  selected: boolean;
}

export interface Permissions {
  [actionId: string]: string[] | { [address: string]: boolean };
}

export interface ReverseAddressBook {
  [address: string]: string;
}

export interface ActionIdsData {
  [deployment: string]: {
    [contract: string]: {
      useAdaptor: boolean;
      actionIds: {
        [functionName: string]: string;
      };
    };
  };
}

export interface PermissionsPayloadBuilderProps {
  addressBook: AddressBook;
}

// State interfaces
interface PermissionsState {
  allPermissions: Permission[];
  filteredPermissions: Permission[];
  selectedPermissions: string[];
  currentPermissions: string[];
  actionIdDescriptions: Record<string, string>;
  loading: boolean;
  permissionsLoading: boolean;
  currentPage: number;
  permissionsPerPage: number;
}

// Action interfaces for reducer
type PermissionsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PERMISSIONS_LOADING"; payload: boolean }
  | {
      type: "SET_ALL_PERMISSIONS";
      payload: { permissions: Permission[]; descriptions: Record<string, string> };
    }
  | { type: "SET_CURRENT_PERMISSIONS"; payload: string[] }
  | { type: "SET_FILTERED_PERMISSIONS"; payload: Permission[] }
  | { type: "TOGGLE_PERMISSION"; payload: string }
  | { type: "REMOVE_PERMISSION"; payload: string }
  | { type: "CLEAR_SELECTED_PERMISSIONS" }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PER_PAGE"; payload: number }
  | { type: "RESET_PERMISSIONS" };

// Component prop interfaces
interface PermissionTagProps {
  permission: string;
  description: string;
  deployment?: string;
  onRemove: (actionId: string) => void;
}

interface VirtualizedPermissionsListProps {
  permissions: Permission[];
  selectedPermissions: string[];
  onToggle: (actionId: string) => void;
  loading: boolean;
}

interface PermissionRowProps {
  index: number;
  style: React.CSSProperties;
}

// Initial state for permissions reducer
const initialPermissionsState: PermissionsState = {
  allPermissions: [],
  filteredPermissions: [],
  selectedPermissions: [],
  currentPermissions: [],
  actionIdDescriptions: {},
  loading: false,
  permissionsLoading: false,
  currentPage: 1,
  permissionsPerPage: 10,
};

// Custom hook types
interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// View type enum
enum PermissionViewType {
  LIST = "list",
  GROUPED = "grouped",
}

// Reducer for handling permissions-related state
function permissionsReducer(state: PermissionsState, action: PermissionsAction): PermissionsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_PERMISSIONS_LOADING":
      return { ...state, permissionsLoading: action.payload };
    case "SET_ALL_PERMISSIONS":
      return {
        ...state,
        allPermissions: action.payload.permissions,
        actionIdDescriptions: action.payload.descriptions,
        filteredPermissions: action.payload.permissions,
        loading: false,
      };
    case "SET_CURRENT_PERMISSIONS":
      return {
        ...state,
        currentPermissions: action.payload,
        permissionsLoading: false,
        currentPage: 1,
      };
    case "SET_FILTERED_PERMISSIONS":
      return { ...state, filteredPermissions: action.payload };
    case "TOGGLE_PERMISSION":
      return {
        ...state,
        selectedPermissions: state.selectedPermissions.includes(action.payload)
          ? state.selectedPermissions.filter(id => id !== action.payload)
          : [...state.selectedPermissions, action.payload],
      };
    case "REMOVE_PERMISSION":
      return {
        ...state,
        selectedPermissions: state.selectedPermissions.filter(id => id !== action.payload),
      };
    case "CLEAR_SELECTED_PERMISSIONS":
      return { ...state, selectedPermissions: [] };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_PER_PAGE":
      return { ...state, permissionsPerPage: action.payload, currentPage: 1 };
    case "RESET_PERMISSIONS":
      return {
        ...state,
        selectedPermissions: [],
        currentPermissions: [],
        currentPage: 1,
      };
    default:
      return state;
  }
}

// Custom hook for API data fetching with caching
function useFetchWithCache<T>(url: string, dependencies: any[] = []): FetchResult<T> {
  const cache = useRef<Record<string, T>>({});
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    const fetchData = async (): Promise<void> => {
      if (cache.current[url]) {
        setData(cache.current[url]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const result = await response.json();
        cache.current[url] = result;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, ...dependencies]);

  return { data, loading, error };
}

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized permission tag component
const PermissionTag: React.FC<PermissionTagProps> = React.memo(
  ({ permission, description, deployment, onRemove }) => {
    return (
      <Popover trigger="hover" placement="top">
        <PopoverTrigger>
          <Tag colorScheme="green" size="md" borderRadius="full" mb={1}>
            <TagLabel>
              {deployment && (
                <Text as="span" fontSize="xs" color="gray.500" mr={1}>
                  {deployment}:
                </Text>
              )}
              {description}
            </TagLabel>
            <TagCloseButton onClick={() => onRemove(permission)} />
          </Tag>
        </PopoverTrigger>
        <PopoverContent width="auto" maxW="600px">
          <PopoverArrow />
          <PopoverBody>
            <Text fontSize="xs" fontFamily="monospace" wordBreak="break-all">
              {permission}
            </Text>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  },
);

PermissionTag.displayName = "PermissionTag";

// Memoized permissions list component with virtualization
const VirtualizedPermissionsList: React.FC<VirtualizedPermissionsListProps> = React.memo(
  ({ permissions, selectedPermissions, onToggle, loading }) => {
    if (loading) {
      return (
        <Flex justify="center" align="center" p={4}>
          <Spinner />
        </Flex>
      );
    }

    if (!permissions.length) {
      return <Text>No matching permissions found</Text>;
    }

    const PermissionRow = ({ index, style }: PermissionRowProps) => {
      const permission = permissions[index];
      return (
        <div style={style}>
          <Checkbox
            isChecked={selectedPermissions.includes(permission.actionId)}
            onChange={() => onToggle(permission.actionId)}
            colorScheme="green"
          >
            <Flex direction="column">
              <Text fontSize="sm">{permission.description}</Text>
              <Text color="gray.500" fontSize="xs" fontFamily="monospace">
                {permission.actionId}
              </Text>
            </Flex>
          </Checkbox>
        </div>
      );
    };

    return (
      <List
        height={300}
        itemCount={permissions.length}
        itemSize={50}
        width="100%"
        overscanCount={5}
      >
        {PermissionRow}
      </List>
    );
  },
);

VirtualizedPermissionsList.displayName = "VirtualizedPermissionsList";

const PermissionsPayloadBuilder: React.FC<PermissionsPayloadBuilderProps> = ({ addressBook }) => {
  const toast = useToast();

  // Network related state
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");

  // Wallet related state
  const [availableWallets, setAvailableWallets] = useState<Record<string, string>>({});
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [customWalletInput, setCustomWalletInput] = useState<string>("");
  const [daoAddress, setDAOAddress] = useState<string>("");
  const [authorizerAdaptor, setAuthorizerAdaptor] = useState<string>("");

  // Reverse lookup state
  const [reverseAddressBook, setReverseAddressBook] = useState<ReverseAddressBook>({});

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  // View state
  const [permissionViewType, setPermissionViewType] = useState<PermissionViewType>(
    PermissionViewType.GROUPED,
  );

  // Payload state
  const [generatedPayload, setGeneratedPayload] = useState<string | BatchFile | null>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);

  // Use reducer for permissions-related state
  const [permissionsState, dispatchPermissions] = useReducer(
    permissionsReducer,
    initialPermissionsState,
  );

  // Filter networks
  const filteredNetworkOptions = NETWORK_OPTIONS.filter(network => network.apiID !== "SONIC");

  // Load wallets when network changes
  useEffect(() => {
    loadWallets();
  }, [selectedNetwork, addressBook]);

  // Load action IDs and reverse lookup on network change
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      dispatchPermissions({ type: "SET_LOADING", payload: true });
      await Promise.all([loadActionIds(), loadReverseLookup()]);
      dispatchPermissions({ type: "SET_LOADING", payload: false });
    };

    fetchData();
  }, [selectedNetwork]);

  // Load permissions when wallet changes
  useEffect(() => {
    if (selectedWallet) {
      loadWalletPermissions();
    }
  }, [selectedWallet, selectedNetwork]);

  // Filter permissions based on search term
  useEffect(() => {
    if (debouncedSearchTerm.trim() === "") {
      dispatchPermissions({
        type: "SET_FILTERED_PERMISSIONS",
        payload: permissionsState.allPermissions,
      });
    } else {
      const lowercasedSearchTerm = debouncedSearchTerm.toLowerCase();
      const filtered = permissionsState.allPermissions.filter(
        permission =>
          permission.actionId.toLowerCase().includes(lowercasedSearchTerm) ||
          permission.description.toLowerCase().includes(lowercasedSearchTerm) ||
          permission.deployment.toLowerCase().includes(lowercasedSearchTerm),
      );
      dispatchPermissions({ type: "SET_FILTERED_PERMISSIONS", payload: filtered });
    }
  }, [debouncedSearchTerm, permissionsState.allPermissions]);

  // Memoized sorted and paginated permissions
  const sortedCurrentPermissions = useMemo((): string[] => {
    return [...permissionsState.currentPermissions].sort((a, b) => {
      const descA = permissionsState.actionIdDescriptions[a] || a;
      const descB = permissionsState.actionIdDescriptions[b] || b;
      return descA.toLowerCase().localeCompare(descB.toLowerCase());
    });
  }, [permissionsState.currentPermissions, permissionsState.actionIdDescriptions]);

  const paginatedPermissions = useMemo((): string[] => {
    const startIndex = (permissionsState.currentPage - 1) * permissionsState.permissionsPerPage;
    const endIndex = startIndex + permissionsState.permissionsPerPage;
    return sortedCurrentPermissions.slice(startIndex, endIndex);
  }, [sortedCurrentPermissions, permissionsState.currentPage, permissionsState.permissionsPerPage]);

  const totalPages = useMemo((): number => {
    return Math.ceil(sortedCurrentPermissions.length / permissionsState.permissionsPerPage);
  }, [sortedCurrentPermissions, permissionsState.permissionsPerPage]);

  // Load wallets for the selected network
  const loadWallets = useCallback((): void => {
    const multisigs = getCategoryData(addressBook, selectedNetwork, "multisigs");
    const formattedAddresses: Record<string, string> = {};

    if (multisigs && typeof multisigs === "object") {
      Object.entries(multisigs).forEach(([key, value]) => {
        if (typeof value === "string") {
          formattedAddresses[`multisig.${key}`] = value;
        } else if (typeof value === "object" && value !== null) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (typeof nestedValue === "string") {
              formattedAddresses[`multisig.${key}.${nestedKey}`] = nestedValue;
            }
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

    setAuthorizerAdaptor(authorizer || "");
    setDAOAddress(daoWallet || "");
    setAvailableWallets(formattedAddresses);
    setSelectedWallet("");
    setCustomWalletInput("");

    // Reset permissions state when network changes
    dispatchPermissions({ type: "RESET_PERMISSIONS" });
    setGeneratedPayload(null);
    setHumanReadableText(null);
  }, [selectedNetwork, addressBook]);

  // Load reverse lookup data
  const loadReverseLookup = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/BalancerMaxis/bal_addresses/main/outputs/${selectedNetwork}_reverse.json`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reverse lookup data: ${response.statusText}`);
      }

      const data = (await response.json()) as ReverseAddressBook;
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
  }, [selectedNetwork, toast]);

  // Load action IDs
  const loadActionIds = useCallback(async (): Promise<boolean> => {
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
      const descriptionsMap: Record<string, string> = {};

      for (const [deployment, contracts] of Object.entries(data)) {
        for (const [contract, contractData] of Object.entries(contracts)) {
          if (contractData.actionIds) {
            for (const [functionName, actionId] of Object.entries(contractData.actionIds)) {
              // Only add if not already in the array (avoid duplicates)
              if (!descriptionsMap[actionId]) {
                permissionsArray.push({
                  actionId,
                  description: `${contract}.${functionName}`,
                  deployment,
                  selected: false,
                });

                descriptionsMap[actionId] = `${deployment}/${contract}.${functionName}`;
              }
            }
          }
        }
      }

      dispatchPermissions({
        type: "SET_ALL_PERMISSIONS",
        payload: {
          permissions: permissionsArray,
          descriptions: descriptionsMap,
        },
      });

      return true;
    } catch (error) {
      console.error("Error loading action IDs:", error);
      toast({
        title: "Error loading action IDs",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      dispatchPermissions({ type: "SET_LOADING", payload: false });
      return false;
    }
  }, [selectedNetwork, toast]);

  // Load wallet permissions
  const loadWalletPermissions = useCallback(async (): Promise<void> => {
    try {
      dispatchPermissions({ type: "SET_PERMISSIONS_LOADING", payload: true });

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

      dispatchPermissions({
        type: "SET_CURRENT_PERMISSIONS",
        payload: walletPermissions,
      });
    } catch (error) {
      console.error("Error loading wallet permissions:", error);
      toast({
        title: "Error loading wallet permissions",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      dispatchPermissions({ type: "SET_PERMISSIONS_LOADING", payload: false });
    }
  }, [selectedNetwork, selectedWallet, toast]);

  // Handle network change
  const handleNetworkChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedApiID = e.target.value;

    // First find the network option by apiID
    const selectedOption = NETWORK_OPTIONS.find(option => option.apiID === selectedApiID);
    setSelectedNetwork(selectedOption ? selectedOption?.apiID.toLowerCase() : "mainnet");
    setSelectedWallet("");
    setCustomWalletInput("");
    dispatchPermissions({ type: "RESET_PERMISSIONS" });
    setGeneratedPayload(null);
    setHumanReadableText(null);
  }, []);

  // Handle wallet selection
  const handleWalletSelect = useCallback((address: string): void => {
    setSelectedWallet(address);
    setCustomWalletInput("");
    dispatchPermissions({ type: "CLEAR_SELECTED_PERMISSIONS" });
    setGeneratedPayload(null);
    setHumanReadableText(null);
  }, []);

  // Toggle permission selection
  const handlePermissionToggle = useCallback((actionId: string): void => {
    dispatchPermissions({ type: "TOGGLE_PERMISSION", payload: actionId });
  }, []);

  // Remove selected permission
  const removeSelectedPermission = useCallback((actionId: string): void => {
    dispatchPermissions({ type: "REMOVE_PERMISSION", payload: actionId });
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number): void => {
    dispatchPermissions({ type: "SET_PAGE", payload: newPage });
  }, []);

  // Handle permissions per page change
  const handlePermissionsPerPageChange = useCallback((value: number): void => {
    dispatchPermissions({ type: "SET_PER_PAGE", payload: value });
  }, []);

  // Toggle view type
  const toggleViewType = useCallback((): void => {
    setPermissionViewType(prevType =>
      prevType === PermissionViewType.LIST ? PermissionViewType.GROUPED : PermissionViewType.LIST,
    );
  }, []);

  // Copy to clipboard utility
  const copyToClipboard = useCallback(
    (text: string): void => {
      navigator.clipboard.writeText(text).catch(err => {
        console.error("Failed to copy to clipboard:", err);
      });
      toast({
        title: "Copied to clipboard!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [toast],
  );

  // Generate payload
  const generatePayload = useCallback((): void => {
    if (permissionsState.selectedPermissions.length === 0) {
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
    const chainId =
      filteredNetworkOptions.find(opt => opt.apiID === selectedNetwork.toUpperCase())?.chainId ||
      "1";

    // Prepare input for payload generator
    const permissionInput: PermissionInput = {
      actionIds: permissionsState.selectedPermissions,
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
      permissionsState.selectedPermissions,
      permissionsState.actionIdDescriptions,
      selectedWallet,
      readableWalletName,
    );

    setHumanReadableText(humanReadable);
  }, [
    permissionsState.selectedPermissions,
    permissionsState.actionIdDescriptions,
    selectedWallet,
    selectedNetwork,
    filteredNetworkOptions,
    daoAddress,
    authorizerAdaptor,
    availableWallets,
    toast,
  ]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  }, []);

  // Get permission description helper
  const getPermissionDescription = useCallback(
    (actionId: string): string => {
      return permissionsState.actionIdDescriptions[actionId] || actionId;
    },
    [permissionsState.actionIdDescriptions],
  );

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
                networkOptions={filteredNetworkOptions}
                selectedNetwork={selectedNetwork.toUpperCase()}
                handleNetworkChange={handleNetworkChange}
              />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4} mt={4}>
            {/* Wallet Selection */}
            <FormControl>
              <FormLabel>Select Wallet</FormLabel>
              <SearchableAddressInput
                value={selectedWallet}
                onChange={handleWalletSelect}
                addresses={availableWallets}
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        {selectedWallet && (
          <Card p={4} mb={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading as="h3" size="md">
                Available Permissions
              </Heading>
              <HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {permissionViewType === PermissionViewType.GROUPED ? "Grouped" : "List"} View
                </Text>
                <IconButton
                  aria-label="Toggle view"
                  icon={
                    permissionViewType === PermissionViewType.GROUPED ? (
                      <HamburgerIcon />
                    ) : (
                      <ViewIcon />
                    )
                  }
                  size="sm"
                  onClick={toggleViewType}
                  variant="outline"
                />
              </HStack>
            </Flex>

            <FormControl mb={4}>
              <FormLabel>Search Permissions</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search by contract, function name, or action ID"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </FormControl>

            {permissionsState.selectedPermissions.length > 0 && (
              <Box mb={4} p={3} borderWidth="1px" borderRadius="md">
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Heading as="h4" size="sm">
                    Selected Permissions ({permissionsState.selectedPermissions.length})
                  </Heading>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => dispatchPermissions({ type: "CLEAR_SELECTED_PERMISSIONS" })}
                  >
                    Clear All
                  </Button>
                </Flex>
                <Flex flexWrap="wrap" gap={2}>
                  {permissionsState.selectedPermissions.map(permission => {
                    // Find the full permission object to get deployment info
                    const permObj = permissionsState.allPermissions.find(
                      p => p.actionId === permission,
                    );
                    return (
                      <PermissionTag
                        key={`selected-${permission.substring(0, 8)}`}
                        permission={permission}
                        description={getPermissionDescription(permission)}
                        deployment={permObj?.deployment}
                        onRemove={removeSelectedPermission}
                      />
                    );
                  })}
                </Flex>
              </Box>
            )}

            <Box height="300px">
              {permissionViewType === PermissionViewType.GROUPED ? (
                <GroupedPermissionsList
                  permissions={permissionsState.filteredPermissions}
                  selectedPermissions={permissionsState.selectedPermissions}
                  onToggle={handlePermissionToggle}
                  loading={permissionsState.loading}
                  searchTerm={searchTerm}
                />
              ) : (
                <VirtualizedPermissionsList
                  permissions={permissionsState.filteredPermissions}
                  selectedPermissions={permissionsState.selectedPermissions}
                  onToggle={handlePermissionToggle}
                  loading={permissionsState.loading}
                />
              )}
            </Box>
          </Card>
        )}

        {selectedWallet && (
          <Card p={4} mb={4} overflowX="auto">
            {/* Using the refactored PermissionsTable component */}
            <PermissionsTable
              loading={permissionsState.permissionsLoading}
              permissions={paginatedPermissions}
              getPermissionDescription={getPermissionDescription}
              currentPage={permissionsState.currentPage}
              totalPages={totalPages}
              handlePageChange={handlePageChange}
              permissionsPerPage={permissionsState.permissionsPerPage}
              handlePermissionsPerPageChange={handlePermissionsPerPageChange}
              copyToClipboard={copyToClipboard}
              totalPermissionsCount={permissionsState.currentPermissions.length}
            />
          </Card>
        )}
      </Box>

      {selectedWallet && (
        <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
          <Button
            variant="primary"
            onClick={generatePayload}
            isDisabled={
              permissionsState.loading || permissionsState.selectedPermissions.length === 0
            }
          >
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton
              batchFile={
                typeof generatedPayload === "string"
                  ? JSON.parse(generatedPayload)
                  : generatedPayload
              }
            />
          )}
        </Flex>
      )}

      <Divider />

      {generatedPayload && (
        <>
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={(newJson: string | BatchFile) => setGeneratedPayload(newJson)}
          />

          <Box display="flex" alignItems="center" mt="20px">
            <Button
              variant="secondary"
              mr="10px"
              leftIcon={<DownloadIcon />}
              onClick={() => {
                if (generatedPayload) {
                  const jsonStr =
                    typeof generatedPayload === "string"
                      ? generatedPayload
                      : JSON.stringify(generatedPayload, null, 2);
                  handleDownloadClick(jsonStr);
                }
              }}
            >
              Download Payload
            </Button>
            <Button
              variant="secondary"
              leftIcon={<CopyIcon />}
              onClick={() => {
                if (generatedPayload) {
                  const jsonForClipboard =
                    typeof generatedPayload === "string"
                      ? generatedPayload
                      : JSON.stringify(generatedPayload, null, 2);
                  copyJsonToClipboard(jsonForClipboard, toast);
                }
              }}
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
};

export default PermissionsPayloadBuilder;
