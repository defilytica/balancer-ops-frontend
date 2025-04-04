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
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  List,
  ListItem,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  copyJsonToClipboard,
  generateDAOSwapFeeChangePayload,
  handleDownloadClick,
  SwapFeeChangeInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS, networks, V3_VAULT_ADDRESS } from "@/constants/constants";
import {
  GetV3PoolsDocument,
  GetV3PoolsQuery,
  GetV3PoolsQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import { PoolInfoCard } from "@/components/PoolInfoCard";
import { PRCreationModal } from "@/components/modal/PRModal";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { getCategoryData, getNetworksWithCategory } from "@/lib/data/maxis/addressBook";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { DollarSign } from "react-feather";
import { ethers } from "ethers";
import { isZeroAddress } from "@ethereumjs/util";
import { V3vaultAdmin } from "@/abi/v3vaultAdmin";
import { useAccount, useSwitchChain } from "wagmi";
import { NetworkSelector } from "@/components/NetworkSelector";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";
import { ParameterChangeCard } from "./ParameterChangeCard";

export default function ChangeSwapFeeV3Module({ addressBook }: { addressBook: AddressBook }) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [newSwapFee, setNewSwapFee] = useState<string>("");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");
  const [isCurrentWalletManager, setIsCurrentWalletManager] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const { loading, error, data } = useQuery<GetV3PoolsQuery, GetV3PoolsQueryVariables>(
    GetV3PoolsDocument,
    {
      variables: { chainIn: [selectedNetwork as any] },
      skip: !selectedNetwork,
    },
  );

  const getMultisigForNetwork = useCallback(
    (network: string) => {
      // For SONIC, we fetch predefined constants
      if (network.toLowerCase() === 'sonic') {
        const sonic = NETWORK_OPTIONS.find(el => el.apiID === "SONIC");
        return sonic? sonic?.maxiSafe : "";
      }
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

  const networkOptionsWithV3 = useMemo(() => {
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");
    return NETWORK_OPTIONS.filter(network => (networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === 'SONIC'));
  }, [addressBook]);

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newNetwork = e.target.value;
      setSelectedNetwork(newNetwork);
      setSelectedMultisig(getMultisigForNetwork(newNetwork));
      setSelectedPool(null);
      setGeneratedPayload(null);
      setSearchTerm("");
      setNewSwapFee("");
      setIsCurrentWalletManager(false);

      // Find the corresponding chain ID for the selected network
      const networkOption = networkOptionsWithV3.find(n => n.apiID === newNetwork);
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

  // Check manager status when pool is selected
  const handlePoolSelection = useCallback(async (pool: Pool) => {
    setSelectedPool(pool); // Set pool immediately for UI update
  }, []);

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

  const handleGenerateClick = async () => {
    if (!selectedPool || !newSwapFee || !selectedNetwork) {
      toast({
        title: "Missing information",
        description: "Please select a network, pool, and enter a new swap fee",
        status: "warning",
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

      const input: SwapFeeChangeInput = {
        poolAddress: selectedPool.address,
        newSwapFeePercentage: newSwapFee,
        poolName: selectedPool.name,
      };

      const payload = generateDAOSwapFeeChangePayload(input, network.chainId, selectedMultisig);
      setGeneratedPayload(JSON.stringify(payload, null, 2));
    }
    // Case 2: Current wallet is the fee manager
    else if (isCurrentWalletManager) {
      try {
        // This try/catch is needed to handle errors that occur before toast.promise
        // such as errors during transaction creation, contract method calls, etc.
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contract = new ethers.Contract(V3_VAULT_ADDRESS, V3vaultAdmin, signer);

        const swapFeePercentage = ((parseFloat(newSwapFee) / 100) * 1e18).toString();

        const tx = await contract.setStaticSwapFeePercentage(
          selectedPool.address.toLowerCase(),
          swapFeePercentage,
        );

        // toast.promise handles errors during transaction confirmation (tx.wait)
        toast.promise(tx.wait(), {
          success: {
            title: "Success",
            description: `The swap fee has been updated to ${newSwapFee}%. Changes will appear in the UI in the next few minutes after the block is indexed.`,
            duration: 5000,
            isClosable: true,
          },
          loading: {
            title: "Updating swap fee",
            description: "Waiting for transaction confirmation... Please wait.",
          },
          error: (error: any) => ({
            title: "Error",
            description: error.message,
            duration: 7000,
            isClosable: true,
          }),
        });
      } catch (error: any) {
        // This catches errors that happen before toast.promise, such as transaction creation errors
        toast({
          title: "Error executing transaction",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const filteredPools = useMemo(() => {
    if (!data?.poolGetPools) return [];
    return data.poolGetPools.filter(
      pool =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.address.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.poolGetPools, searchTerm]);

  const currentFee = selectedPool ? parseFloat(selectedPool.dynamicData.swapFee) * 100 : 0;
  const newFee = newSwapFee ? parseFloat(newSwapFee) : currentFee;

  // Check if the pool is authorized for DAO governance (zero address or matches the multisig)
  const isAuthorizedPool = useMemo(() => {
    if (!selectedPool?.swapFeeManager) return false;
    return (
      isZeroAddress(selectedPool.swapFeeManager) ||
      selectedPool.swapFeeManager.toLowerCase() === selectedMultisig.toLowerCase()
    );
  }, [selectedPool, selectedMultisig]);

  const getPrefillValues = () => {
    // Make sure we have a selected pool and new swap fee
    if (!selectedPool || !newSwapFee) return {};

    // Generate a unique ID for the branch and file
    const uniqueId = generateUniqueId();

    // Create a truncated version of the pool address for the branch name
    const shortPoolId = selectedPool.address.substring(0, 8);

    // Get pool name for the description
    const poolName = selectedPool.name;

    // Create fee change description
    const currentFee = parseFloat(selectedPool.dynamicData.swapFee) * 100;
    const newFee = parseFloat(newSwapFee);
    const feeChangeDirection = newFee > currentFee ? "increase" : "decrease";

    // Find the network name from the selected network
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const networkName = networkOption?.label || selectedNetwork;

    // Create just the filename - path will come from the config
    const filename = `set-swap-fee-${selectedPool.address}-${uniqueId}.json`;

    return {
      prefillBranchName: `feature/swap-fee-${shortPoolId}-${uniqueId}`,
      prefillPrName: `Change Swap Fee for ${poolName} on ${networkName}`,
      prefillDescription: `This PR ${feeChangeDirection}s the swap fee for ${poolName} (${shortPoolId}) from ${currentFee.toFixed(4)}% to ${newFee.toFixed(4)}% on ${networkName}.`,
      prefillFilename: filename
    };
  };

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        Balancer v3: Create Swap Fee Change Payload
      </Heading>

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
          <FormControl isDisabled={!selectedNetwork}>
            <FormLabel>Select Pool</FormLabel>
            <Popover>
              <PopoverTrigger>
                <Input
                  value={selectedPool ? `${selectedPool.name} - ${selectedPool.address}` : ""}
                  placeholder="Search and select a pool"
                  readOnly
                />
              </PopoverTrigger>
              <PopoverContent width="100%">
                <PopoverBody>
                  <Input
                    placeholder="Search pools..."
                    mb={2}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <List maxH="200px" overflowY="auto">
                    {filteredPools.map(pool => (
                      <ListItem
                        key={pool.address}
                        onClick={() => {
                          handlePoolSelection(pool as unknown as Pool);
                          onClose();
                        }}
                        cursor="pointer"
                        _hover={{ bg: "gray.100" }}
                        p={2}
                      >
                        {pool.name} - {pool.address.slice(0, 6)}...
                        {pool.address.slice(-4)}
                      </ListItem>
                    ))}
                  </List>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </FormControl>
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
              <PoolInfoCard pool={selectedPool} />
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
              <PoolInfoCard pool={selectedPool} />
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
                    : `This pool's swap fee can only be modified by the swap fee manager: ${selectedPool.swapFeeManager}`}
                </AlertDescription>
              </Alert>
            </Box>
          )}

          <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <FormControl
                isDisabled={!selectedPool || (!isAuthorizedPool && !isCurrentWalletManager)}
                mb={4}
              >
                <FormLabel>New Swap Fee Percentage</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={newSwapFee}
                  onChange={e => setNewSwapFee(e.target.value)}
                  placeholder={`Current: ${currentFee.toFixed(4)}%`}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                />
              </FormControl>
            </GridItem>
          </Grid>
        </>
      )}

      {selectedPool && newSwapFee && (
        <ParameterChangeCard
          title="Swap Fee Change Preview"
          icon={<DollarSign size={24} />}
          parameters={[
            {
              name: "Swap Fee",
              currentValue: currentFee,
              newValue: newFee,
              precision: 4,
              unit: "%",
            },
          ]}
        />
      )}

      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        {!selectedPool ? (
          <Button variant="primary" isDisabled={true}>
            Select a Pool
          </Button>
        ) : isCurrentWalletManager ? (
          <Button variant="primary" onClick={handleGenerateClick} isDisabled={!newSwapFee}>
            Execute Fee Change
          </Button>
        ) : isAuthorizedPool ? (
          <Button variant="primary" onClick={handleGenerateClick} isDisabled={!newSwapFee}>
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
          <OpenPRButton onClick={handleOpenPRModal} network={selectedNetwork}/>
          <Box mt={8} />
          <PRCreationModal
            type={"fee-setter-v3"}
            isOpen={isOpen}
            onClose={onClose}
            payload={generatedPayload ? JSON.parse(generatedPayload) : null}
            {...getPrefillValues()}
          />
        </Box>
      )}
    </Container>
  );
}
