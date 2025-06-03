"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  AmpFactorUpdateInput,
  copyJsonToClipboard,
  generateAmpFactorUpdatePayload,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import {
  GetPoolsDocument,
  GetPoolsQuery,
  GetPoolsQueryVariables,
  GqlPoolType,
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import { PoolInfoCard } from "@/components/PoolInfoCard";
import { PRCreationModal } from "@/components/modal/PRModal";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { TrendingUp } from "react-feather";
import { NetworkSelector } from "@/components/NetworkSelector";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";
import { getMultisigForNetwork } from "@/lib/utils/getMultisigForNetwork";
import PoolSelector from "./PoolSelector";
import { ParameterChangePreviewCard } from "./ParameterChangePreviewCard";
import { useDebounce } from "use-debounce";
import { useAmpFactor } from "@/app/hooks/amp-factor/useAmpFactor";

const AUTHORIZED_OWNER = "0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b";

interface ChangeAmpFactorProps {
  addressBook: AddressBook;
}

// Validation function for amp factor
const validateAmpFactor = (value: string): string | null => {
  if (!value || value.trim() === "") return null;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "Must be a valid number";
  if (numValue < 1) return "Amplification factor must be at least 1";
  if (numValue > 10000) return "Amplification factor must not exceed 10,000";

  return null;
};

// Validation function for end time
const validateEndTime = (value: string): string | null => {
  if (!value || value.trim() === "") return "End time is required";

  const selectedTime = new Date(value);
  const now = new Date();
  const minTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  if (selectedTime <= now) return "End time must be in the future";
  if (selectedTime < minTime) return "End time must be at least 24 hours from now";

  return null;
};

export default function ChangeAmpFactorModuleV2({ addressBook }: ChangeAmpFactorProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [newAmpFactor, setNewAmpFactor] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");

  const [debouncedAmpFactor] = useDebounce(newAmpFactor, 300);
  const [debouncedEndDateTime] = useDebounce(endDateTime, 300);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const filteredNetworkOptions = NETWORK_OPTIONS.filter(network => network.apiID !== "SONIC");

  // Validation
  const ampFactorError = validateAmpFactor(debouncedAmpFactor);
  const endTimeError = validateEndTime(debouncedEndDateTime);
  const isValid = !ampFactorError && !endTimeError && debouncedAmpFactor && debouncedEndDateTime;

  const { loading, error, data } = useQuery<GetPoolsQuery, GetPoolsQueryVariables>(
    GetPoolsDocument,
    {
      variables: {
        chainIn: [selectedNetwork as any],
      },
      skip: !selectedNetwork,
    },
  );

  // Filter pools to only show v2 stable pools that support amplification factor
  const filteredPools = useMemo(() => {
    if (!data?.poolGetPools) return [];

    const stablePoolTypes = [
      GqlPoolType.Stable,
      GqlPoolType.MetaStable,
      GqlPoolType.ComposableStable,
    ];
    return data.poolGetPools.filter(
      pool => stablePoolTypes.includes(pool.type as GqlPoolType) && pool.protocolVersion === 2, // Only Balancer v2 pools
    );
  }, [data?.poolGetPools]);

  const resolveMultisig = useCallback(
    (network: string) => getMultisigForNetwork(addressBook, network, "lm"),
    [addressBook],
  );

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newNetwork = e.target.value;
      setSelectedNetwork(newNetwork);
      setSelectedMultisig(resolveMultisig(newNetwork));
      setSelectedPool(null);
      setGeneratedPayload(null);
      setNewAmpFactor("");
      setEndDateTime("");
    },
    [resolveMultisig],
  );

  const handlePoolSelect = (pool: Pool) => {
    setSelectedPool(pool);
    setGeneratedPayload(null);
    setNewAmpFactor("");
    setEndDateTime("");
  };

  const clearPoolSelection = () => {
    setSelectedPool(null);
    setGeneratedPayload(null);
    setNewAmpFactor("");
    setEndDateTime("");
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

  const isAuthorizedPool = useMemo(() => {
    if (!selectedPool) return false;

    // Check if the swapFeeManager is the authorized owner (same as swap fee module)
    return selectedPool.swapFeeManager === AUTHORIZED_OWNER;
  }, [selectedPool]);

  const handleGenerateClick = () => {
    if (
      !selectedPool ||
      !debouncedAmpFactor ||
      !debouncedEndDateTime ||
      !selectedNetwork ||
      !isValid
    ) {
      toast({
        title: "Missing information",
        description:
          "Please select a network, pool, and enter valid amplification factor and end time",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isAuthorizedPool) {
      toast({
        title: "Unauthorized pool",
        description: "This pool cannot be modified as it is not owned by the authorized address.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const network = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    if (!network) {
      toast({
        title: "Invalid network",
        description: "The selected network is not valid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Convert datetime to unix timestamp
    const endTime = Math.floor(new Date(debouncedEndDateTime).getTime() / 1000).toString();

    const input: AmpFactorUpdateInput = {
      poolAddress: selectedPool.address,
      rawEndValue: debouncedAmpFactor,
      endTime: endTime,
      poolName: selectedPool.name,
    };

    const payload = generateAmpFactorUpdatePayload(input, network.chainId, selectedMultisig);
    setGeneratedPayload(JSON.stringify(payload, null, 2));
  };

  const {
    data: ampFactorData,
    isLoading: isLoadingAmp,
    error: ampError,
  } = useAmpFactor(selectedPool?.address, selectedNetwork.toLowerCase());

  const getPrefillValues = useCallback(() => {
    if (!selectedPool || !debouncedAmpFactor || !debouncedEndDateTime) return {};

    const uniqueId = generateUniqueId();
    const shortPoolId = selectedPool.address.substring(0, 8);
    const poolName = selectedPool.name;

    // Get current amp factor for comparison
    const currentAmp = ampFactorData?.amplificationParameter || 0;
    const newAmp = debouncedAmpFactor ? parseInt(debouncedAmpFactor) : 0;
    const changeDirection = newAmp > currentAmp ? "increase" : "decrease";

    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const networkName = networkOption?.label || selectedNetwork;
    const networkPath = networkName === "Ethereum" ? "Mainnet" : networkName;

    const filename = networkPath + `/amp-factor-update-${selectedPool.address}-${uniqueId}.json`;

    return {
      prefillBranchName: `feature/amp-factor-${shortPoolId}-${uniqueId}`,
      prefillPrName: `Update Amplification Factor for ${poolName} on ${networkName}`,
      prefillDescription: `This PR ${changeDirection}s the amplification factor for ${poolName} (${shortPoolId}) from ${Math.round(currentAmp)} to ${newAmp} on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [
    selectedPool,
    debouncedAmpFactor,
    debouncedEndDateTime,
    selectedNetwork,
    ampFactorData?.amplificationParameter,
  ]);

  // Get minimum datetime (24 hours from now)
  const getMinDateTime = () => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return minTime.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const currentAmp = ampFactorData?.amplificationParameter || 0;
  const newAmp = debouncedAmpFactor ? parseInt(debouncedAmpFactor) : 0;

  // Determine if we should show the form fields
  const shouldShowFormFields = selectedPool && !isLoadingAmp && !ampError && ampFactorData;

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        Balancer v2: Create Amplification Factor Update Payload
      </Heading>

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <NetworkSelector
            networks={networks}
            networkOptions={filteredNetworkOptions}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          {selectedNetwork && (
            <PoolSelector
              pools={filteredPools}
              loading={loading}
              error={error}
              selectedPool={selectedPool}
              onPoolSelect={pool => handlePoolSelect(pool as Pool)}
              onClearSelection={clearPoolSelection}
            />
          )}
        </GridItem>
      </Grid>

      {selectedPool && (
        <Box mb={6}>
          <PoolInfoCard pool={selectedPool} />
          {ampFactorData?.isUpdating && (
            <Alert status="info" mt={4}>
              <AlertIcon />
              <AlertDescription>
                This pool is currently undergoing an amplification parameter update.
              </AlertDescription>
            </Alert>
          )}
          {!isAuthorizedPool && (
            <Alert status="warning" mt={4}>
              <AlertIcon />
              <AlertDescription>
                This pool is not owned by the authorized delegate address and cannot be modified.
                Only the pool owner can modify this pool.
              </AlertDescription>
            </Alert>
          )}
        </Box>
      )}

      {/* Loading state when pool is selected but amp factor data is loading */}
      {selectedPool && isLoadingAmp && (
        <Box mb={6} p={6} textAlign="center" borderWidth="1px" borderRadius="lg">
          <Spinner size="lg" color="blue.500" mb={4} />
          <Text fontSize="lg" fontWeight="medium" color="gray.600">
            Loading amplification factor data...
          </Text>
          <Text fontSize="sm" color="gray.500">
            Please wait while we fetch the current pool parameters
          </Text>
        </Box>
      )}

      {/* Error state when amp factor loading fails */}
      {selectedPool && ampError && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertDescription>
            Failed to load amplification factor data. Please try selecting the pool again or check
            your network connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Form fields - only show when amp factor data is loaded */}
      {shouldShowFormFields && (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
          <GridItem colSpan={{ base: 12, md: 6 }}>
            <FormControl mb={4} isInvalid={!!ampFactorError}>
              <FormLabel>New Amplification Factor</FormLabel>
              <Input
                type="number"
                value={newAmpFactor}
                onChange={e => setNewAmpFactor(e.target.value)}
                placeholder={`Current: ${Math.round(currentAmp)}`}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                min={1}
                max={10000}
              />
              <FormHelperText>Enter a value between 1 and 10,000</FormHelperText>
              {ampFactorError && <FormErrorMessage>{ampFactorError}</FormErrorMessage>}
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 12, md: 6 }}>
            <FormControl mb={4} isInvalid={!!endTimeError}>
              <FormLabel>Update End Time</FormLabel>
              <Input
                type="datetime-local"
                value={endDateTime}
                onChange={e => setEndDateTime(e.target.value)}
                min={getMinDateTime()}
              />
              <FormHelperText>
                Must be at least 24 hours from now
                {endDateTime && !endTimeError && (
                  <Text as="span" color="blue.600" ml={2}>
                    (Unix: {Math.floor(new Date(endDateTime).getTime() / 1000)})
                  </Text>
                )}
              </FormHelperText>
              {endTimeError && <FormErrorMessage>{endTimeError}</FormErrorMessage>}
            </FormControl>
          </GridItem>
        </Grid>
      )}

      {/* Only show preview card if form fields are visible and amp factor is entered */}
      {shouldShowFormFields && debouncedAmpFactor && !ampFactorError && (
        <ParameterChangePreviewCard
          title="Amplification Factor Change Preview"
          icon={<TrendingUp size={24} />}
          parameters={[
            {
              name: "Amplification Factor",
              currentValue: Math.round(currentAmp).toString(),
              newValue: newAmp.toString(),
              difference: (newAmp - Math.round(currentAmp)).toString(),
            },
          ]}
        />
      )}

      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        <Button
          variant="primary"
          onClick={handleGenerateClick}
          isDisabled={!selectedPool || !isAuthorizedPool || !isValid || isLoadingAmp}
        >
          Generate Payload
        </Button>
        {generatedPayload && <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />}
      </Flex>
      <Divider />

      {generatedPayload && (
        <JsonViewerEditor
          jsonData={generatedPayload}
          onJsonChange={newJson => setGeneratedPayload(newJson)}
        />
      )}

      {generatedPayload && (
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
          <Box mt={8} />
          <PRCreationModal
            type={"amp-factor-update-v2"}
            isOpen={isOpen}
            onClose={onClose}
            network={selectedNetwork}
            payload={generatedPayload ? JSON.parse(generatedPayload) : null}
            {...getPrefillValues()}
          />
        </Box>
      )}
    </Container>
  );
}
