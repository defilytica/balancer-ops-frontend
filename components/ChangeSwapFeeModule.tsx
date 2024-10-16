"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  List,
  ListItem,
  Select,
  Spinner,
  Text,
  useColorMode,
  useToast,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Divider,
} from "@chakra-ui/react";
import { DollarSign } from "react-feather";
import dynamic from "next/dynamic";

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

import {
  copyJsonToClipboard,
  generateSwapFeeChangePayload,
  handleDownloadClick,
  SwapFeeChangeInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS } from "@/constants/constants";
import {
  GetPoolsDocument,
  GetPoolsQuery,
  GetPoolsQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import { Pool } from "@/types/interfaces";
import { PoolInfoCard } from "@/components/PoolInfoCard";
import { PRCreationModal } from "@/components/modal/PRModal";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import { VscGithubInverted } from "react-icons/vsc";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { AddressBook } from "@/types/interfaces";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import OpenPRButton from "./btns/OpenPRButton";

const AUTHORIZED_OWNER = "0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b";

interface ChangeSwapFeeProps {
  addressBook: AddressBook;
}

export default function ChangeSwapFeeModule({
  addressBook,
}: ChangeSwapFeeProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [newSwapFee, setNewSwapFee] = useState<string>("");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");

  const { colorMode } = useColorMode();
  const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const getMultisigForNetwork = useCallback(
    (network: string) => {
      const multisigs = getCategoryData(
        addressBook,
        network.toLowerCase(),
        "multisigs",
      );
      if (multisigs && multisigs["lm"]) {
        const lm = multisigs["lm"];
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

  const { loading, error, data } = useQuery<
    GetPoolsQuery,
    GetPoolsQueryVariables
  >(GetPoolsDocument, {
    variables: { chainIn: [selectedNetwork as any] },
    skip: !selectedNetwork,
  });

  const filteredPools = useMemo(() => {
    if (!data?.poolGetPools) return [];
    return data.poolGetPools.filter(
      (pool) =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.address.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.poolGetPools, searchTerm]);

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newNetwork = e.target.value;
      setSelectedNetwork(newNetwork);
      setSelectedMultisig(getMultisigForNetwork(newNetwork));
      setSelectedPool(null);
      setGeneratedPayload(null);
      setSearchTerm("");
      setNewSwapFee("");
    },
    [getMultisigForNetwork],
  );

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

  const isAuthorizedPool = selectedPool?.owner === AUTHORIZED_OWNER;

  const handleGenerateClick = () => {
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

    if (!isAuthorizedPool) {
      toast({
        title: "Unauthorized pool",
        description:
          "This pool cannot be modified as it is not owned by the authorized address.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const network = NETWORK_OPTIONS.find((n) => n.apiID === selectedNetwork);
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

    const payload = generateSwapFeeChangePayload(
      input,
      network.chainId,
      selectedMultisig,
    );
    setGeneratedPayload(JSON.stringify(payload, null, 2));
  };

  const currentFee = selectedPool
    ? parseFloat(selectedPool.dynamicData.swapFee) * 100
    : 0;
  const newFee = newSwapFee ? parseFloat(newSwapFee) : 0;
  const feeChange = newFee - currentFee;

  return (
    <Container maxW="container.lg">
      <Heading as="h2" size="lg" variant="special" mb={6}>
        Create Swap Fee Change Payload
      </Heading>

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <FormControl>
            <FormLabel>Select Network</FormLabel>
            <Select
              value={selectedNetwork}
              onChange={handleNetworkChange}
              placeholder="Select Network"
            >
              {NETWORK_OPTIONS.map((network) => (
                <option key={network.chainId} value={network.apiID}>
                  {network.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          <FormControl isDisabled={!selectedNetwork}>
            <FormLabel>Select Pool</FormLabel>
            <Popover>
              <PopoverTrigger>
                <Input
                  value={
                    selectedPool
                      ? `${selectedPool.name} - ${selectedPool.address}`
                      : ""
                  }
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <List maxH="200px" overflowY="auto">
                    {filteredPools.map((pool) => (
                      <ListItem
                        key={pool.address}
                        onClick={() => {
                          setSelectedPool(pool as unknown as Pool);
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
          {selectedPool && (
            <Box mb={6}>
              <PoolInfoCard pool={selectedPool} />
              {!isAuthorizedPool && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  <AlertDescription>
                    This pool is not owned by the authorized delegate address
                    and cannot be modified. Only the pool owner can modify this
                    pool.
                  </AlertDescription>
                </Alert>
              )}
            </Box>
          )}

          <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
            <GridItem colSpan={{ base: 12, md: 4 }}>
              <FormControl isDisabled={!selectedPool || !isAuthorizedPool}>
                <FormLabel>New Swap Fee Percentage</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={newSwapFee}
                  onChange={(e) => setNewSwapFee(e.target.value)}
                  placeholder="Enter new swap fee (e.g., 0.1)"
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
                        <StatNumber>{currentFee.toFixed(2)}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>New Fee</StatLabel>
                        <StatNumber>{newFee.toFixed(2)}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Change</StatLabel>
                        <StatNumber>
                          {Math.abs(feeChange).toFixed(2)}%
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow
                            type={feeChange > 0 ? "increase" : "decrease"}
                          />
                          {feeChange > 0 ? "Increase" : "Decrease"}
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
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mt="20px"
        mb="10px"
      >
        <Button
          variant="primary"
          onClick={handleGenerateClick}
          isDisabled={!selectedPool || !isAuthorizedPool || !newSwapFee}
        >
          Generate Payload
        </Button>
        {generatedPayload && (
          <SimulateTransactionButton batchFile={generatedPayload} />
        )}
      </Flex>
      <Divider />

      {generatedPayload && (
        <Box mt="20px">
          <Text fontSize="lg" mb="10px">
            Generated JSON Payload:
          </Text>
          <ReactJson
            theme={reactJsonTheme}
            src={JSON.parse(generatedPayload)}
          />
        </Box>
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
