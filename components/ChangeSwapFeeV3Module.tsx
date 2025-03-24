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
  Select,
  Spinner,
  Stat,
  StatArrow,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
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

const AUTHORIZED_DAO_OWNER = "0x0000000000000000000000000000000000000000";

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
  const { chains, switchChain } = useSwitchChain();

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
    return NETWORK_OPTIONS.filter(network => networksWithV3.includes(network.apiID.toLowerCase()));
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

    const swapFeePercentage = ((parseFloat(newSwapFee) / 100) * 1e18).toString();

    // Case 1: Zero address manager (DAO governed)
    if (isZeroAddress(selectedPool.swapFeeManager)) {
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
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log("Signer status:", signer);
        const contract = new ethers.Contract(V3_VAULT_ADDRESS, V3vaultAdmin, signer);

        const tx = await contract.setStaticSwapFeePercentage(
          selectedPool.address.toLowerCase(),
          swapFeePercentage,
        );
        console.log("tx:", tx);
        await tx.wait();

        toast({
          title: "Success",
          description: "Swap fee updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (error: any) {
        toast({
          title: "Transaction Failed",
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
  const newFee = newSwapFee ? parseFloat(newSwapFee) : 0;
  const feeChange = newFee - currentFee;
  const isAuthorizedPool = selectedPool?.swapFeeManager === AUTHORIZED_DAO_OWNER;

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
              <Alert
                status={isZeroAddress(selectedPool.swapFeeManager) ? "info" : "warning"}
                mt={4}
              >
                <AlertIcon />
                <AlertDescription>
                  {isZeroAddress(selectedPool.swapFeeManager)
                    ? "This pool is DAO-governed. Changes must be executed through the multisig."
                    : `This pool's swap fee can only be modified by the swap fee manager: ${selectedPool.swapFeeManager}`}
                </AlertDescription>
              </Alert>
            </Box>
          )}

          <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
            <GridItem colSpan={{ base: 12, md: 4 }}>
              <FormControl
                isDisabled={!selectedPool || (!isAuthorizedPool && !isCurrentWalletManager)}
              >
                <FormLabel>New Swap Fee Percentage</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={newSwapFee}
                  onChange={e => setNewSwapFee(e.target.value)}
                  placeholder="Enter new swap fee (e.g., 0.1)"
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                />
              </FormControl>
            </GridItem>
            <GridItem colSpan={{ base: 12, md: 8 }}>
              {selectedPool && newSwapFee && (
                <Card>
                  <CardHeader>
                    <Flex alignItems="center">
                      <DollarSign size={24} />
                      <Heading size="md" ml={2}>
                        Swap Fee Change Preview
                      </Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <StatGroup>
                      <Stat>
                        <StatLabel>Current Fee</StatLabel>
                        <StatNumber>{currentFee.toFixed(4)}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>New Fee</StatLabel>
                        <StatNumber>{newFee.toFixed(4)}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Change</StatLabel>
                        <StatNumber>{Math.abs(feeChange).toFixed(4)}%</StatNumber>
                        <StatHelpText>
                          {feeChange === 0 ? (
                            "No Change"
                          ) : (
                            <>
                              <StatArrow type={feeChange > 0 ? "increase" : "decrease"} />
                              {feeChange > 0 ? "Increase" : "Decrease"}
                            </>
                          )}
                        </StatHelpText>
                      </Stat>
                    </StatGroup>
                  </CardBody>
                </Card>
              )}
            </GridItem>
          </Grid>
        </>
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
        ) : isZeroAddress(selectedPool.swapFeeManager) ? (
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
          <OpenPRButton onClick={handleOpenPRModal} />
          <Box mt={8} />
          <PRCreationModal
            type={"set-swapfee"}
            isOpen={isOpen}
            onClose={onClose}
            payload={generatedPayload ? JSON.parse(generatedPayload) : null}
          />
        </Box>
      )}
    </Container>
  );
}
