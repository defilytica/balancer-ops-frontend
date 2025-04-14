"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Grid,
  GridItem,
  Heading,
  Input,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  copyJsonToClipboard,
  generateMevCaptureParamsPayload,
  handleDownloadClick,
  MevCaptureParamsInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import {
  GetV3PoolsWithHooksQuery,
  GetV3PoolsWithHooksQueryVariables,
  GetV3PoolsWithHooksDocument,
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool, MevTaxHookParams, HookParams } from "@/types/interfaces";
import { PRCreationModal } from "@/components/modal/PRModal";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { DollarSign } from "react-feather";
import { ethers, parseUnits } from "ethers";
import { isZeroAddress } from "@ethereumjs/util";
import { mevCaptureHookAbi } from "@/abi/MevCaptureHook";
import { useAccount, useSwitchChain } from "wagmi";
import { NetworkSelector } from "@/components/NetworkSelector";
import { PoolInfoCard } from "./PoolInfoCard";
import { ParameterChangePreviewCard } from "./ParameterChangePreviewCard";
import PoolSelector from "./PoolSelector";
import { formatGwei, parseEther } from "viem";
import { useSearchParams } from "next/navigation";

// Type guard for MevTaxHookParams
export const isMevTaxHookParams = (params?: HookParams): params is MevTaxHookParams => {
  if (!params) return false;
  return (
    params.__typename === "MevTaxHookParams" ||
    ("mevTaxThreshold" in params && "mevTaxMultiplier" in params)
  );
};

export default function MevCaptureHookConfigurationModule({
  addressBook,
}: {
  addressBook: AddressBook;
}) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [newMevTaxThreshold, setNewMevTaxThreshold] = useState<string>("");
  const [newMevTaxMultiplier, setNewMevTaxMultiplier] = useState<string>("");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");
  const [isCurrentWalletManager, setIsCurrentWalletManager] = useState(false);

  // Input validation states
  const [mevTaxThresholdError, setMevTaxThresholdError] = useState<string>("");
  const [mevTaxMultiplierError, setMevTaxMultiplierError] = useState<string>("");

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const searchParams = useSearchParams();
  const initialNetworkSetRef = useRef(false);

  //Chain state switch
  const { switchChain } = useSwitchChain();

  // Add wallet connection hook
  const { address: walletAddress } = useAccount();

  // Add effect to check manager status when wallet changes
  useEffect(() => {
    const checkManagerStatus = async () => {
      if (!selectedPool || !window.ethereum) {
        setIsCurrentWalletManager(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        const isManager = selectedPool.swapFeeManager.toLowerCase() === signerAddress.toLowerCase();
        setIsCurrentWalletManager(isManager);
      } catch (error) {
        console.error("Error checking manager status:", error);
        setIsCurrentWalletManager(false);
      }
    };

    checkManagerStatus();
  }, [selectedPool, walletAddress]); // Dependencies include both selectedPool and walletAddress

  const { loading, error, data } = useQuery<
    GetV3PoolsWithHooksQuery,
    GetV3PoolsWithHooksQueryVariables
  >(GetV3PoolsWithHooksDocument, {
    variables: { chainIn: [selectedNetwork as any], tagIn: ["HOOKS_MEVCAPTURE"] },
    skip: !selectedNetwork,
  });

  const getMultisigForNetwork = useCallback(
    (network: string) => {
      const multisigs = getCategoryData(addressBook, network.toLowerCase(), "multisigs");
      if (multisigs && multisigs["maxi_omni"]) {
        const lm = multisigs["maxi_omni"];
        if (typeof lm === "string") {
          return lm;
        } else if (typeof lm === "object") {
          return Object.values(lm)[0];
        }
      }
      return "";
    },
    [addressBook],
  );

  const networkOptions = useMemo(() => {
    const allowedNetworks = ["base", "optimism"];
    return NETWORK_OPTIONS.filter(network => allowedNetworks.includes(network.apiID.toLowerCase()));
  }, [addressBook]);

  // Handle URL parameters for pre-selection
  useEffect(() => {
    const networkParam = searchParams.get("network");
    const poolParam = searchParams.get("pool");

    if (networkParam && !initialNetworkSetRef.current) {
      // Find the network option that matches the network parameter
      const networkOption = networkOptions.find(
        n => n.apiID.toLowerCase() === networkParam.toLowerCase(),
      );

      if (networkOption) {
        setSelectedNetwork(networkOption.apiID);
        setSelectedMultisig(getMultisigForNetwork(networkOption.apiID));
        initialNetworkSetRef.current = true;
      }
    }
  }, [searchParams, networkOptions, getMultisigForNetwork]);

  // Separate effect to handle pool selection when data is loaded
  useEffect(() => {
    const poolParam = searchParams.get("pool");

    if (poolParam && data?.poolGetPools && selectedNetwork) {
      const pool = data.poolGetPools.find(p => p.address.toLowerCase() === poolParam.toLowerCase());
      if (pool) {
        setSelectedPool(pool as unknown as Pool);
      }
    }
  }, [searchParams, data?.poolGetPools, selectedNetwork]);

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newNetwork = e.target.value;
      setSelectedNetwork(newNetwork);
      setSelectedMultisig(getMultisigForNetwork(newNetwork));
      setSelectedPool(null);
      setGeneratedPayload(null);
      setNewMevTaxThreshold("");
      setNewMevTaxMultiplier("");
      setIsCurrentWalletManager(false);

      // Find the corresponding chain ID for the selected network
      const networkOption = networkOptions.find(n => n.apiID === newNetwork);
      if (networkOption) {
        try {
          switchChain({ chainId: Number(networkOption.chainId) });
        } catch (error) {
          toast({
            title: "Error switching network",
            description: "Please switch network manually in your wallet",
            status: "error",
            duration: 5000,
          });
        }
      }
    },
    [getMultisigForNetwork, switchChain, toast],
  );

  const handlePoolSelect = (pool: Pool) => {
    setSelectedPool(pool);
  };

  const clearPoolSelection = () => {
    setSelectedPool(null);
    setGeneratedPayload(null);
    setNewMevTaxThreshold("");
    setNewMevTaxMultiplier("");
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

  // Constants for input validation
  const MIN_THRESHOLD_GWEI = 0.001;
  const MAX_THRESHOLD_GWEI = 1.0;
  const MIN_MULTIPLIER = 2;
  const MAX_MULTIPLIER = 1000;

  const validateMevTaxThreshold = (value: string): boolean => {
    if (!value) {
      setMevTaxThresholdError("");
      return true;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setMevTaxThresholdError("Please enter a valid number");
      return false;
    }

    if (numValue < MIN_THRESHOLD_GWEI) {
      setMevTaxThresholdError(`Value must be at least ${MIN_THRESHOLD_GWEI} Gwei`);
      return false;
    }

    if (numValue > MAX_THRESHOLD_GWEI) {
      setMevTaxThresholdError(`Value must not exceed ${MAX_THRESHOLD_GWEI} Gwei`);
      return false;
    }

    setMevTaxThresholdError("");
    return true;
  };

  const validateMevTaxMultiplier = (value: string): boolean => {
    if (!value) {
      setMevTaxMultiplierError("");
      return true;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      setMevTaxMultiplierError("Please enter a valid number");
      return false;
    }

    // Check if it's a whole number
    if (!Number.isInteger(numValue)) {
      setMevTaxMultiplierError("Please enter a whole number (no decimals)");
      return false;
    }

    if (numValue < MIN_MULTIPLIER) {
      setMevTaxMultiplierError(`Value must be at least ${MIN_MULTIPLIER}`);
      return false;
    }

    if (numValue > MAX_MULTIPLIER) {
      setMevTaxMultiplierError(`Value must not exceed ${MAX_MULTIPLIER}`);
      return false;
    }

    setMevTaxMultiplierError("");
    return true;
  };

  // Handle threshold input change with validation
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMevTaxThreshold(value);
    validateMevTaxThreshold(value);
  };

  // Handle multiplier input change with validation
  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMevTaxMultiplier(value);
    validateMevTaxMultiplier(value);
  };

  const handleGenerateClick = async () => {
    if (!selectedPool || (!newMevTaxThreshold && !newMevTaxMultiplier) || !selectedNetwork) {
      toast({
        title: "Missing information",
        description: "Please select a network, pool, and enter at least one parameter to change",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate inputs before proceeding
    const isThresholdValid = !newMevTaxThreshold || validateMevTaxThreshold(newMevTaxThreshold);
    const isMultiplierValid = !newMevTaxMultiplier || validateMevTaxMultiplier(newMevTaxMultiplier);

    if (!isThresholdValid || !isMultiplierValid) {
      toast({
        title: "Invalid input values",
        description: "Please correct the input errors before generating the payload",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Case 1: Zero or maxi_omni address manager (DAO governed)
    if (isAuthorizedPool) {
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

      // Use the new helper function to generate the payload
      const hookAddress = selectedPool.hook?.address;
      if (!hookAddress) {
        toast({
          title: "Missing hook address",
          description: "The pool must have a hook address to modify hook parameters.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const input: MevCaptureParamsInput = {
        poolAddress: selectedPool.address,
        newMevTaxThreshold: newMevTaxThreshold,
        newMevTaxMultiplier: newMevTaxMultiplier,
      };

      const payload = generateMevCaptureParamsPayload(
        input,
        network.chainId,
        hookAddress,
        selectedMultisig,
      );
      setGeneratedPayload(JSON.stringify(payload, null, 2));
    }
    // Case 2: Current wallet is the fee manager
    else if (isCurrentWalletManager) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const hookContract = new ethers.Contract(
          selectedPool.hook?.address!!,
          mevCaptureHookAbi,
          signer,
        );

        // Update MEV tax threshold if provided (convert from Gwei to Wei)
        if (newMevTaxThreshold) {
          const txMevTaxThreshold = parseUnits(newMevTaxThreshold, "gwei");

          const tx1 = await hookContract.setPoolMevTaxThreshold(
            selectedPool.address,
            txMevTaxThreshold,
          );

          toast.promise(tx1.wait(), {
            success: {
              title: "Success",
              description: `The MEV tax threshold has been updated to ${newMevTaxThreshold} Gwei. Changes will appear in the UI in the next few minutes after the block is indexed.`,
              duration: 5000,
              isClosable: true,
            },
            loading: {
              title: "Updating MEV tax threshold",
              description: "Waiting for transaction confirmation... Please wait.",
            },
            error: (error: any) => ({
              title: "Error",
              description: error.message,
              duration: 7000,
              isClosable: true,
            }),
          });
        }

        // Update MEV tax multiplier if provided
        if (newMevTaxMultiplier) {
          // Convert multiplier from MEther to Wei for tx payload
          const txMevTaxMultiplier = parseUnits(newMevTaxMultiplier, 24);
          const tx2 = await hookContract.setPoolMevTaxMultiplier(
            selectedPool.address,
            txMevTaxMultiplier.toString(),
          );

          toast.promise(tx2.wait(), {
            success: {
              title: "Success",
              description: `The MEV tax multiplier has been updated to ${newMevTaxMultiplier}. Changes will appear in the UI in the next few minutes after the block is indexed.`,
              duration: 5000,
              isClosable: true,
            },
            loading: {
              title: "Updating MEV tax multiplier",
              description: "Waiting for transaction confirmation... Please wait.",
            },
            error: (error: any) => ({
              title: "Error",
              description: error.message,
              duration: 7000,
              isClosable: true,
            }),
          });
        }
      } catch (error: any) {
        toast({
          title: "Error executing transactions",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const currentMevTaxThreshold =
    selectedPool &&
    selectedPool.hook?.type === "MEV_TAX" &&
    selectedPool.hook.params &&
    isMevTaxHookParams(selectedPool.hook.params)
      ? selectedPool.hook.params.mevTaxThreshold
      : "0";

  const currentMevTaxMultiplier =
    selectedPool &&
    selectedPool.hook?.type === "MEV_TAX" &&
    selectedPool.hook.params &&
    isMevTaxHookParams(selectedPool.hook.params)
      ? selectedPool.hook.params.mevTaxMultiplier
      : "0";

  // API returns value in ETH, convert to GWei for display (1 ETH = 10^9 GWei)
  const displayCurrentMevTaxThreshold = useMemo(() => {
    if (!currentMevTaxThreshold || currentMevTaxThreshold === "0") return "0";
    return formatGwei(parseEther(currentMevTaxThreshold)).toString();
  }, [currentMevTaxThreshold]);

  // Convert from Ether to MEther (divide by 1e6)
  const displayCurrentMevTaxMultiplier = useMemo(() => {
    if (!currentMevTaxMultiplier || currentMevTaxMultiplier === "0") return "0";
    return (Number(currentMevTaxMultiplier) / 1e6).toString();
  }, [currentMevTaxMultiplier]);

  const isAuthorizedPool = useMemo(() => {
    if (!selectedPool?.swapFeeManager) return false;
    return (
      isZeroAddress(selectedPool.swapFeeManager) ||
      selectedPool.swapFeeManager.toLowerCase() === selectedMultisig.toLowerCase()
    );
  }, [selectedPool, selectedMultisig]);

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        Configure MEV Capture Hook
      </Heading>

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <NetworkSelector
            networks={networks}
            networkOptions={networkOptions}
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
              selectedPool={selectedPool}
              onPoolSelect={pool => handlePoolSelect(pool as Pool)}
              onClearSelection={clearPoolSelection}
            />
          )}
        </GridItem>
      </Grid>

      {loading ? (
        <Flex justify="center" my={4}>
          <Spinner />
        </Flex>
      ) : error ? (
        <Alert status="error" mt={4}>
          <AlertIcon />
          <AlertTitle>Error loading pools</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          {selectedPool && isCurrentWalletManager && (
            <Box mb={6}>
              <PoolInfoCard pool={selectedPool} showHook={true} />
              {isCurrentWalletManager && (
                <Alert status="info" mt={4}>
                  <AlertIcon />
                  <AlertDescription>
                    This pool is owned by the authorized delegate address that is currently
                    connected. It can now be modified. Change swap fee settings and execute through
                    your connected EOA.
                  </AlertDescription>
                </Alert>
              )}
            </Box>
          )}

          {selectedPool && !isCurrentWalletManager && (
            <Box mb={6}>
              <PoolInfoCard pool={selectedPool} showHook={true} />
              {!isAuthorizedPool && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  <AlertDescription>
                    This pool is not owned by the authorized delegate address and cannot be
                    modified. Only the pool owner can modify this pool.
                  </AlertDescription>
                </Alert>
              )}
            </Box>
          )}

          {selectedPool && !isCurrentWalletManager && (
            <Box mb={6}>
              <Alert status={isAuthorizedPool ? "info" : "warning"} mt={4}>
                <AlertIcon />
                <AlertDescription>
                  {isAuthorizedPool
                    ? "This pool is DAO-governed. Changes must be executed through the multisig."
                    : `This pool's MEV Capture hook configuration can only be modified by the swap fee manager: ${selectedPool.swapFeeManager}`}
                </AlertDescription>
              </Alert>
            </Box>
          )}

          <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <FormControl
                isDisabled={!selectedPool || (!isAuthorizedPool && !isCurrentWalletManager)}
                mb={4}
                isInvalid={!!mevTaxThresholdError}
              >
                <FormLabel>New MEV Tax Threshold (Gwei)</FormLabel>
                <Input
                  type="number"
                  value={newMevTaxThreshold}
                  onChange={handleThresholdChange}
                  placeholder={`Current: ${displayCurrentMevTaxThreshold}`}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  step={0.001}
                  min={MIN_THRESHOLD_GWEI}
                  max={MAX_THRESHOLD_GWEI}
                />
                <FormHelperText>
                  Enter a value between {MIN_THRESHOLD_GWEI} and {MAX_THRESHOLD_GWEI} Gwei
                </FormHelperText>
                {mevTaxThresholdError && (
                  <FormErrorMessage>{mevTaxThresholdError}</FormErrorMessage>
                )}
              </FormControl>
            </GridItem>

            <GridItem colSpan={{ base: 12, md: 6 }}>
              <FormControl
                isDisabled={!selectedPool || (!isAuthorizedPool && !isCurrentWalletManager)}
                mb={4}
                isInvalid={!!mevTaxMultiplierError}
              >
                <FormLabel>New MEV Tax Multiplier</FormLabel>
                <Input
                  type="number"
                  step="1"
                  value={newMevTaxMultiplier}
                  onChange={handleMultiplierChange}
                  placeholder={`Current: ${displayCurrentMevTaxMultiplier}`}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  min={MIN_MULTIPLIER}
                  max={MAX_MULTIPLIER}
                />
                <FormHelperText>
                  Enter a whole number between {MIN_MULTIPLIER} and {MAX_MULTIPLIER}
                </FormHelperText>
                {mevTaxMultiplierError && (
                  <FormErrorMessage>{mevTaxMultiplierError}</FormErrorMessage>
                )}
              </FormControl>
            </GridItem>
          </Grid>
        </>
      )}

      {selectedPool &&
        ((newMevTaxThreshold && !mevTaxThresholdError) ||
          (newMevTaxMultiplier && !mevTaxMultiplierError)) && (
          <ParameterChangePreviewCard
            title="Hook Parameters Change Preview"
            icon={<DollarSign size={24} />}
            parameters={[
              ...(newMevTaxThreshold && !mevTaxThresholdError
                ? [
                    {
                      name: "MEV Tax Threshold",
                      currentValue: `${displayCurrentMevTaxThreshold}`,
                      newValue: `${newMevTaxThreshold}`,
                      difference: (
                        (parseFloat(newMevTaxThreshold) * 1000 -
                          parseFloat(displayCurrentMevTaxThreshold) * 1000) /
                        1000
                      ).toString(),
                    },
                  ]
                : []),
              ...(newMevTaxMultiplier && !mevTaxMultiplierError
                ? [
                    {
                      name: "MEV Tax Multiplier",
                      currentValue: displayCurrentMevTaxMultiplier,
                      newValue: newMevTaxMultiplier,
                      difference: (
                        parseInt(newMevTaxMultiplier) - parseInt(displayCurrentMevTaxMultiplier)
                      ).toString(),
                    },
                  ]
                : []),
            ]}
          />
        )}
      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        {!selectedPool ? (
          <Button variant="primary" isDisabled={true}>
            Select a Pool
          </Button>
        ) : isCurrentWalletManager ? (
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            isDisabled={
              (!newMevTaxThreshold && !newMevTaxMultiplier) ||
              !!mevTaxThresholdError ||
              !!mevTaxMultiplierError
            }
          >
            Execute Parameter Change
          </Button>
        ) : isAuthorizedPool ? (
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            isDisabled={
              (!newMevTaxThreshold && !newMevTaxMultiplier) ||
              !!mevTaxThresholdError ||
              !!mevTaxMultiplierError
            }
          >
            Generate Payload
          </Button>
        ) : (
          <Button variant="primary" isDisabled={true}>
            Not Authorized
          </Button>
        )}

        {generatedPayload && !isCurrentWalletManager && (
          <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
        )}
      </Flex>
      <Divider />

      {generatedPayload && !isCurrentWalletManager && (
        <JsonViewerEditor
          jsonData={generatedPayload}
          onJsonChange={newJson => setGeneratedPayload(newJson)}
        />
      )}

      {generatedPayload && !isCurrentWalletManager && (
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
          <OpenPRButton onClick={handleOpenPRModal} />
          <Box mt={8} />
          <PRCreationModal
            type={"hook-mev-capture"}
            isOpen={isOpen}
            onClose={onClose}
            payload={generatedPayload ? JSON.parse(generatedPayload) : null}
          />
        </Box>
      )}
    </Container>
  );
}
