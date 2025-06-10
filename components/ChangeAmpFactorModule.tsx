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
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import { useValidateAmpFactor } from "@/lib/hooks/validation/useValidateAmpFactor";
import { useValidateEndTime } from "@/lib/hooks/validation/useValidateEndTime";

// Constants for different protocol versions
const PROTOCOL_CONFIG = {
  v2: {
    authorizedOwner: "0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b",
    multisigType: "lm" as const,
    protocolVersion: 2,
    title: "Balancer v2: Create Amplification Factor Update Payload",
    prType: "amp-factor-update-v2" as const,
  },
  v3: {
    authorizedOwner: "0x0000000000000000000000000000000000000000",
    multisigType: "maxi_omni" as const,
    protocolVersion: 3,
    title: "Balancer v3: Create Amplification Factor Update Payload",
    prType: "amp-factor-update-v3" as const,
  },
} as const;

type ProtocolVersion = keyof typeof PROTOCOL_CONFIG;

interface ChangeAmpFactorProps {
  addressBook: AddressBook;
  protocolVersion: ProtocolVersion;
}

export default function ChangeAmpFactorModule({
  addressBook,
  protocolVersion,
}: ChangeAmpFactorProps) {
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

  // Get protocol-specific configuration
  const config = PROTOCOL_CONFIG[protocolVersion];

  const filteredNetworkOptions = useMemo(() => {
    let baseOptions = NETWORK_OPTIONS.filter(network => network.apiID !== "SONIC");

    // For v3, filter to only networks where v3 vault is deployed
    if (protocolVersion === "v3") {
      const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
      baseOptions = baseOptions.filter(
        network =>
          networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
      );
    }

    return baseOptions;
  }, [protocolVersion, addressBook]);
  const {
    data: ampFactorData,
    isLoading: isLoadingAmp,
    error: ampError,
  } = useAmpFactor(selectedPool?.address, selectedNetwork.toLowerCase());

  // Validation with rate limit checks (moved after ampFactorData declaration)
  const { ampFactorError, isValid: isAmpFactorValid } = useValidateAmpFactor({
    value: debouncedAmpFactor,
    currentAmp: ampFactorData?.amplificationParameter || 0,
    endDateTime: debouncedEndDateTime,
  });

  const {
    endTimeError,
    isValid: isEndTimeValid,
    unixTimestamp,
    timeInfo,
  } = useValidateEndTime({
    value: debouncedEndDateTime,
  });
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

  // Filter pools based on protocol version and pool types
  const filteredPools = useMemo(() => {
    if (!data?.poolGetPools) return [];

    const stablePoolTypes = [
      GqlPoolType.Stable,
      GqlPoolType.MetaStable,
      GqlPoolType.ComposableStable,
    ];

    return data.poolGetPools.filter(
      pool =>
        stablePoolTypes.includes(pool.type as GqlPoolType) &&
        pool.protocolVersion === config.protocolVersion,
    );
  }, [data?.poolGetPools, config.protocolVersion]);

  const resolveMultisig = useCallback(
    (network: string) => getMultisigForNetwork(addressBook, network, config.multisigType),
    [addressBook, config.multisigType],
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
    return (
      selectedPool.swapFeeManager === config.authorizedOwner ||
      "0x9ff471f9f98f42e5151c7855fd1b5aa906b1af7e"
    );
  }, [selectedPool, config.authorizedOwner]);

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

  // Calculate rate limit information for display
  const getRateLimitInfo = (currentAmp: number, endDateTime: string) => {
    if (!currentAmp || !endDateTime) return null;

    const selectedTime = new Date(endDateTime);
    const now = new Date();
    const timeDiffHours = (selectedTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilEnd = Math.max(timeDiffHours / 24, 1);
    const maxChangeFactor = Math.pow(2, daysUntilEnd);

    const minAllowed = Math.max(1, Math.round(currentAmp / maxChangeFactor));
    const maxAllowed = Math.min(10000, Math.round(currentAmp * maxChangeFactor));

    return {
      daysUntilEnd: daysUntilEnd.toFixed(1),
      minAllowed,
      maxAllowed,
      maxChangeFactor: maxChangeFactor.toFixed(2),
    };
  };

  // Get minimum datetime (24 hours from now)
  const getMinDateTime = () => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return minTime.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const currentAmp = ampFactorData?.amplificationParameter || 0;
  const newAmp = debouncedAmpFactor ? parseInt(debouncedAmpFactor) : 0;
  const rateLimitInfo = getRateLimitInfo(currentAmp, debouncedEndDateTime);

  // Determine if we should show the form fields
  const shouldShowFormFields = selectedPool && !isLoadingAmp && !ampError && ampFactorData;

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        {config.title}
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
        <>
          {/* Information alert about rate limits */}
          <Alert status="info" mb={4}>
            <AlertIcon />
            <AlertDescription>
              <strong>Amplification Factor Rate Limits:</strong> Changes are limited to prevent
              price manipulation. The amplification factor cannot change more than a factor of 2 in
              a single day. Current factor: <strong>{Math.round(currentAmp)}</strong>
            </AlertDescription>
          </Alert>

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
                <FormHelperText>
                  Enter a value between 1 and 5,000
                  {rateLimitInfo && (
                    <>
                      <br />
                      <Text as="span" color="blue.600">
                        Allowed range for {rateLimitInfo.daysUntilEnd} days:{" "}
                        {rateLimitInfo.minAllowed} - {rateLimitInfo.maxAllowed}
                      </Text>
                      <br />
                      <Text as="span" color="gray.500" fontSize="xs">
                        (Max change factor: {rateLimitInfo.maxChangeFactor}x over{" "}
                        {rateLimitInfo.daysUntilEnd} days)
                      </Text>
                    </>
                  )}
                </FormHelperText>
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
        </>
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
            type={config.prType}
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
