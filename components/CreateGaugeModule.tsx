"use client";

import React, {useState, useMemo, useCallback, useEffect} from "react";
import { useQuery } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
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
    useToast,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    Text,
    Radio,
    RadioGroup,
    Stack,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody, VStack, Center, UnorderedList, OrderedList, HStack, Badge, InputGroup, InputRightElement, IconButton,
} from "@chakra-ui/react";
import {useAccount, useSwitchChain} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import {
    GetPoolsDocument,
    GetPoolsQuery,
    GetPoolsQueryVariables, VeBalGetVotingGaugesDocument,
    VeBalGetVotingGaugesQuery
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import {GAUGE_WEIGHT_CAPS, MAINNET_GAUGE_FACTORY, NETWORK_OPTIONS, networks} from "@/constants/constants";
import {CloseIcon, ExternalLinkIcon, InfoIcon} from "@chakra-ui/icons";
import { LiquidityGaugeFactory } from "@/abi/LiquidityGaugeFactory";
import { RootGaugeFactory } from "@/abi/RootGaugeFactory";
import { ChildGaugeFactory } from "@/abi/ChildGaugeFactory";
import {WeightCapType} from "@/types/types";

interface CreateGaugeProps {
    addressBook: AddressBook;
}

interface TransactionState {
    hash: string;
    status: 'pending' | 'success' | 'error';
    type: 'childGauge' | 'rootGauge';
    address?: string;
}

interface PoolItem {
    name: string;
    address: string;
    staking?: {
        gauge?: {
            id: string;
        };
    };
}

const getContract = (address: string, abi: any, signer: ethers.Signer) => {
    return new ethers.Contract(address, abi, signer);
};

export default function CreateGaugeModule({ addressBook }: CreateGaugeProps) {
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [transactions, setTransactions] = useState<TransactionState[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [weightCap, setWeightCap] = useState<WeightCapType>(GAUGE_WEIGHT_CAPS.TWO_PERCENT);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const toast = useToast();
    const { address } = useAccount();
    const { openConnectModal } = useConnectModal();

    //Chain state switch
    const { chains, switchChain } = useSwitchChain()

    //Pool data
    const { loading, error, data } = useQuery<GetPoolsQuery, GetPoolsQueryVariables>(
        GetPoolsDocument,
        {
            variables: { chainIn: [selectedNetwork as any] },
            skip: !selectedNetwork,
        }
    );

    const { data: votingGaugesData } = useQuery<VeBalGetVotingGaugesQuery>(
        VeBalGetVotingGaugesDocument,
    );

    const existingRootGauge = useMemo(() => {
        if (!selectedPool?.staking?.gauge?.id || !votingGaugesData?.veBalGetVotingList) {
            return null;
        }

        // Find matching root gauge for the selected child gauge
        return votingGaugesData.veBalGetVotingList.find(
            (gauge) => gauge.gauge?.childGaugeAddress?.toLowerCase() === selectedPool.staking?.gauge?.id.toLowerCase()
        );
    }, [selectedPool, votingGaugesData]);

    // Function to get explorer URL based on network
    const getExplorerUrl = (network: string, hash: string) => {
        const networkKey = network.toLowerCase();
        const explorerBase = networks[networkKey]?.explorer || networks.mainnet.explorer;
        return `${explorerBase}tx/${hash}`;
    };

    const filteredPools = useMemo(() => {
        if (!data?.poolGetPools) return [];
        return data.poolGetPools.filter(
            (pool) =>
                pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pool.address.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [data?.poolGetPools, searchTerm]);

    // Add condition to check for existing gauge
    const hasExistingGauge = useMemo(() => {
        return selectedPool?.staking?.gauge?.id != null;
    }, [selectedPool]);
    console.log("selectedPool", selectedPool);

    // Add pool selection handler
    const handlePoolSelect = (pool: Pool) => {
        setSelectedPool(pool);
        setIsOpen(false); // Close popover after selection
        setSearchTerm(""); // Reset search term
    };

    // Add a function to reset selection
    const clearPoolSelection = () => {
        setSelectedPool(null);
        setSearchTerm("");
    };

    const shouldSkipChildGauge = hasExistingGauge;
    useEffect(() => {
        if (shouldSkipChildGauge) {
            setActiveStep(1);
        }
    }, [shouldSkipChildGauge]);

    const getChildChainFactoryForNetwork = useCallback((network: string) => {
        const childChainFactory = addressBook.active[network.toLowerCase()]?.["20230316-child-chain-gauge-factory-v2"]?.["ChildChainGaugeFactory"];
        if (typeof childChainFactory === "string") {
            return childChainFactory;
        } else if (childChainFactory && typeof childChainFactory === "object") {
            return Object.values(childChainFactory)[0] || "";
        }
        return "";
    }, [addressBook]);

    const getRootGaugeFactoryForNetwork = useCallback((network: string) => {
        // Convert network to the expected format (e.g., "POLYGON" -> "polygon")
        const normalizedNetwork = network.toLowerCase();

        // Find the correct factory key by matching the network
        const factoryKey = Object.keys(addressBook.active["mainnet"]).find(key =>
            key.toLowerCase().includes(`${normalizedNetwork}-root-gauge-factory`)
        );

        if (!factoryKey) {
            console.error(`No root gauge factory found for network: ${network}`);
            return "";
        }

        // Get the factory contract data
        const factoryData = addressBook.active["mainnet"][factoryKey];

        // Find the correct contract by looking for the *RootGaugeFactory name
        const factoryContract = Object.entries(factoryData).find(([key]) =>
            key.endsWith('RootGaugeFactory')
        );

        if (!factoryContract || !factoryContract[1] || typeof factoryContract[1] !== 'string') {
            console.error(`No valid root gauge factory address found in: ${factoryKey}`);
            return "";
        }

        // Ensure we're returning a string
        return factoryContract[1] as string;
    }, [addressBook]);

    const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newNetwork = e.target.value;
        setSelectedNetwork(newNetwork);
        setSelectedPool(null);
        setTransactions([]);
        setActiveStep(0);

        // Find the corresponding chain ID for the selected network
        const networkOption = NETWORK_OPTIONS.find(n => n.apiID === newNetwork);
        if (networkOption) {
            try {
                switchChain({chainId: Number(networkOption.chainId)});
            } catch (error) {
                toast({
                    title: "Error switching network",
                    description: "Please switch network manually in your wallet",
                    status: "error",
                    duration: 5000,
                });
            }
        }
    };

    const createMainnetGauge = async () => {
        if (!selectedPool || !address) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = getContract(MAINNET_GAUGE_FACTORY, LiquidityGaugeFactory, signer);

            const tx = await contract.create(selectedPool.address, weightCap);

            setTransactions([{
                hash: tx.hash,
                status: 'pending',
                type: 'rootGauge'
            }]);

            const receipt = await tx.wait();

            setTransactions(prev =>
                prev.map(t => t.hash === tx.hash ? {...t, status: 'success'} : t)
            );

            toast({
                title: "Mainnet gauge created successfully",
                description: "You can now create a governance proposal",
                status: "success",
                duration: 5000,
            });
        } catch (error) {
            toast({
                title: "Error creating gauge",
                description: 'There was an error creating gauge, check transaction logs.',
                status: "error",
                duration: 5000,
            });
        }
    };

    const createChildChainGauge = async () => {
        if (!selectedPool || !address) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const childFactory = getChildChainFactoryForNetwork(selectedNetwork);
            const contract = getContract(childFactory, ChildGaugeFactory, signer);

            const tx = await contract.create(selectedPool.address);

            setTransactions(prev => [...prev, {
                hash: tx.hash,
                status: 'pending',
                type: 'childGauge'
            }]);

            const receipt = await tx.wait();

            // Get deployed gauge address from events
            const gaugeCreatedEvent = receipt.logs
                .map((log: { topics: any; data: any; }) => {
                    try {
                        return contract.interface.parseLog({
                            topics: [...log.topics],
                            data: log.data,
                        });
                    } catch {
                        return null;
                    }
                })
                .find((event: { name: string; }) => event?.name === 'GaugeCreated');

            const childGaugeAddress = gaugeCreatedEvent?.args?.gauge;

            setTransactions(prev =>
                prev.map(t => t.hash === tx.hash ?
                    {...t, status: 'success', address: childGaugeAddress} : t
                )
            );
            setActiveStep(1);

            toast({
                title: "Child chain gauge created",
                description: "Now switch to Ethereum mainnet to create root gauge",
                status: "success",
                duration: 5000,
            });
        } catch (error) {
            toast({
                title: "Error creating child chain gauge",
                description: 'There was an error creating gauge, check transaction logs.',
                status: "error",
                duration: 5000,
            });
        }
    };

    const RootGaugeAlert = () => {
        if (!existingRootGauge) return null;

        return (
            <Alert status="warning" mt={4}>
                <AlertIcon />
                <AlertDescription>
                    <Text fontWeight="bold" mb={2}>Existing Root Gauge Detected</Text>
                    <Text>
                        This gauge already has a root gauge on Ethereum ({existingRootGauge.gauge?.address}).
                        {existingRootGauge.gauge?.isKilled && (
                            <Text color="red.500" mt={2}>
                                Note: This root gauge is marked as killed.
                            </Text>
                        )}
                    </Text>
                </AlertDescription>
            </Alert>
        );
    };

    const createRootGauge = async () => {
        if (!selectedPool || !address) return;

        if (existingRootGauge?.gauge && !existingRootGauge.gauge.isKilled) {
            toast({
                title: "Root gauge already exists",
                description: "This child gauge already has an active root gauge on Ethereum.",
                status: "error",
                duration: 5000,
            });
            return;
        }

        // Switch to mainnet for root gauge
        try {
            switchChain({chainId: 1});
        } catch (error) {
            toast({
                title: "Error switching network",
                description: "Please switch network manually in your wallet",
                status: "error",
                duration: 5000,
            });
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Try to get childGaugeAddress from either:
            // 1. Existing gauge in the pool data
            // 2. Recently created child gauge in transactions
            const childGaugeAddress = hasExistingGauge
                ? selectedPool.staking?.gauge?.id
                : transactions.find(t => t.type === 'childGauge')?.address;

            if (!childGaugeAddress) {
                throw new Error("Child gauge address not found");
            }

            const rootFactory = getRootGaugeFactoryForNetwork(selectedNetwork);
            if (!rootFactory) {
                throw new Error("Root gauge factory not found for network");
            }

            const contract = getContract(rootFactory, RootGaugeFactory, signer);

            const tx = await contract.create(childGaugeAddress, weightCap);

            setTransactions(prev => [...prev, {
                hash: tx.hash,
                status: 'pending',
                type: 'rootGauge'
            }]);

            const receipt = await tx.wait();

            setTransactions(prev =>
                prev.map(t => t.hash === tx.hash ? {...t, status: 'success'} : t)
            );

            toast({
                title: "Root gauge created successfully",
                description: "You can now create a governance proposal",
                status: "success",
                duration: 5000,
            });

        } catch (error: any) {
            console.error('Root gauge creation error:', error);
            toast({
                title: "Error creating root gauge",
                description: error.message || 'There was an error creating gauge, check transaction logs.',
                status: "error",
                duration: 5000,
            });
        }
    };

    // Format pool display function
    const formatPoolDisplay = (pool: PoolItem) => {
        const hasGauge = pool.staking?.gauge?.id != null;
        return (
            <HStack justify="space-between" width="100%">
                <Text isTruncated maxW="60%">{pool.name}</Text>
                <HStack spacing={2}>
                    {hasGauge && (
                        <Badge colorScheme="blue" fontSize="xs">
                            Has Gauge
                        </Badge>
                    )}
                    <Text color="gray.500" fontSize="sm">
                        {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                    </Text>
                </HStack>
            </HStack>
        );
    };

    return (
        <Container maxW="container.lg">
            {/* Header Section */}
            <Box mb={8}>
                <Heading as="h2" size="lg" variant="special" mb={4}>
                    Create Staking Gauge
                </Heading>

                <Alert status="info">
                    <AlertIcon />
                    <AlertDescription>
                        <Text fontWeight="bold" mb={2}>Important Information:</Text>
                        <UnorderedList spacing={2}>
                            <ListItem>For mainnet pools, only one transaction is needed to create the gauge</ListItem>
                            <ListItem>For other networks, you will need to:
                                <OrderedList ml={4} mt={1}>
                                    <ListItem>Create a child chain gauge on the selected network</ListItem>
                                    <ListItem>Create a root gauge on Ethereum mainnet</ListItem>
                                </OrderedList>
                            </ListItem>
                            <ListItem>After creation, a governance proposal is required</ListItem>
                            <ListItem>Votes occur every Thursday</ListItem>
                            <ListItem>L2 gauges have a one-week delay in BAL emissions after approval</ListItem>
                            <ListItem>L2 gauges need &gt;0.1% of votes for regular emissions</ListItem>
                        </UnorderedList>
                    </AlertDescription>
                </Alert>

                {hasExistingGauge && (
                    <Alert status="warning" mt={4}>
                        <AlertIcon />
                        <AlertDescription>
                            <Text fontWeight="bold" mb={2}>Existing Gauge Detected</Text>
                            <Text>
                                This pool already has a gauge ({selectedPool?.staking?.gauge?.id}).
                                {!existingRootGauge && " You can proceed to create a root gauge for it."}
                            </Text>
                        </AlertDescription>
                    </Alert>
                )}
                {/* Add the root gauge alert */}
                <RootGaugeAlert />
            </Box>

            {/* Configuration Section */}
            <Box mb={8}>
                <Stack spacing={6}>
                    {/* Network Selection */}
                    <FormControl>
                        <FormLabel>Network</FormLabel>
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

                    {/* Pool Selection */}
                    {selectedNetwork && (
                        <FormControl>
                            <FormLabel>Pool</FormLabel>
                            <Popover
                                isOpen={isOpen}
                                onClose={() => setIsOpen(false)}
                                autoFocus={false}
                            >
                                <PopoverTrigger>
                                    <InputGroup>
                                        <Input
                                            value={selectedPool ? selectedPool.name : ""}
                                            placeholder="Search and select a pool"
                                            onClick={() => setIsOpen(true)}
                                            readOnly
                                        />
                                        {selectedPool && (
                                            <InputRightElement>
                                                <IconButton
                                                    aria-label="Clear selection"
                                                    icon={<CloseIcon />}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearPoolSelection();
                                                   }}
                                                />
                                            </InputRightElement>
                                        )}
                                    </InputGroup>
                                </PopoverTrigger>
                                <PopoverContent width={["400px", "400px", "600px", "800px"]}>
                                    <PopoverBody>
                                        <VStack align="stretch" spacing={3}>
                                            <InputGroup>
                                                <Input
                                                    placeholder="Search by name or address..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    autoFocus
                                                />
                                                {searchTerm && (
                                                    <InputRightElement>
                                                        <IconButton
                                                            aria-label="Clear search"
                                                            icon={<CloseIcon />}
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setSearchTerm("")}
                                                        />
                                                    </InputRightElement>
                                                )}
                                            </InputGroup>

                                            {loading ? (
                                                <Center py={4}><Spinner /></Center>
                                            ) : error ? (
                                                <Alert status="error">
                                                    <AlertIcon />
                                                    <AlertDescription>{error.message}</AlertDescription>
                                                </Alert>
                                            ) : filteredPools.length === 0 ? (
                                                <Text color="gray.500" textAlign="center" py={4}>
                                                    No pools found
                                                </Text>
                                            ) : (
                                                <List
                                                    maxH="300px"
                                                    overflowY="auto"
                                                    borderRadius="md"
                                                    css={{
                                                        '&::-webkit-scrollbar': {
                                                            width: '4px',
                                                        },
                                                        '&::-webkit-scrollbar-track': {
                                                            width: '6px',
                                                        },
                                                        '&::-webkit-scrollbar-thumb': {
                                                            background: 'gray.200',
                                                            borderRadius: '24px',
                                                        },
                                                    }}
                                                >
                                                    {filteredPools.map((pool) => (
                                                        <ListItem
                                                            key={pool.address}
                                                            onClick={() => handlePoolSelect(pool as unknown as Pool)}
                                                            cursor="pointer"
                                                            _hover={{ bg: "gray.50" }}
                                                            p={3}
                                                            borderBottomWidth="1px"
                                                            borderBottomColor="gray.100"
                                                            transition="background-color 0.2s"
                                                        >
                                                            {formatPoolDisplay(pool as unknown as Pool)}
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            )}
                                        </VStack>
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </FormControl>
                    )}

                    {/* Weight Cap Selection */}
                    <FormControl>
                        <FormLabel>
                            veBAL Vote Weight Cap
                            <Tooltip label="The vote weight cap determines the max. amount of veBAL votes a gauge may receive. 2% cap is recommended for most pools">
                                <InfoIcon ml={2} cursor="help" />
                            </Tooltip>
                        </FormLabel>
                        <RadioGroup value={weightCap} onChange={(value: WeightCapType) => setWeightCap(value)}>
                            <Stack direction={["column", "row"]} wrap="wrap" spacing={4}>
                                <Radio value={GAUGE_WEIGHT_CAPS.TWO_PERCENT}>2% Cap (Recommended)</Radio>
                                <Radio value={GAUGE_WEIGHT_CAPS.FIVE_PERCENT}>5% Cap</Radio>
                                <Radio value={GAUGE_WEIGHT_CAPS.TEN_PERCENT}>10% Cap</Radio>
                                <Radio value={GAUGE_WEIGHT_CAPS.UNCAPPED}>Uncapped</Radio>
                            </Stack>
                        </RadioGroup>
                    </FormControl>
                </Stack>
            </Box>

            {/* Action Section */}
            {selectedNetwork && selectedPool && (
                <Card mb={8}>
                    <CardHeader>
                        <Heading size="md">Gauge Creation Steps</Heading>
                    </CardHeader>
                    <CardBody>
                        {selectedNetwork === "MAINNET" ? (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={createMainnetGauge}
                                isDisabled={!address}
                                width="full"
                            >
                                Create Mainnet Gauge
                            </Button>
                        ) : (
                            <Stepper index={activeStep}>
                                <Step>
                                    <StepIndicator>
                                        <StepStatus
                                            complete={<StepIcon />}
                                            incomplete={<StepNumber>1</StepNumber>}
                                            active={<StepNumber>1</StepNumber>}
                                        />
                                    </StepIndicator>
                                    <Box flexShrink='0'>
                                        <StepTitle>Create Child Chain Gauge</StepTitle>
                                        <StepDescription>On {selectedNetwork}</StepDescription>
                                        {!shouldSkipChildGauge && (
                                            <Button
                                                mt={2}
                                                variant="primary"
                                                onClick={createChildChainGauge}
                                                isDisabled={!address || activeStep > 0}
                                            >
                                                Create Child Gauge
                                            </Button>
                                        )}
                                        {shouldSkipChildGauge && (
                                            <Text color="green.500" mt={2}>
                                                Using existing gauge
                                            </Text>
                                        )}
                                    </Box>
                                    <StepSeparator />
                                </Step>
                                <Step>
                                    <StepIndicator>
                                        <StepStatus
                                            complete={<StepIcon />}
                                            incomplete={<StepNumber>2</StepNumber>}
                                            active={<StepNumber>2</StepNumber>}
                                        />
                                    </StepIndicator>
                                    <Box flexShrink='0'>
                                        <StepTitle>Create Root Gauge</StepTitle>
                                        <StepDescription>On Ethereum Mainnet</StepDescription>
                                        <Button
                                            mt={2}
                                            variant="primary"
                                            onClick={createRootGauge}
                                            isDisabled={!address || activeStep !== 1 || (existingRootGauge?.gauge && !existingRootGauge.gauge.isKilled)}
                                        >
                                            {existingRootGauge?.gauge && !existingRootGauge.gauge.isKilled
                                                ? "Root Gauge Exists"
                                                : "Create Root Gauge"}
                                        </Button>
                                    </Box>
                                </Step>
                            </Stepper>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Transaction History Section */}
            {transactions.length > 0 && (
                <Card>
                    <CardHeader>
                        <Heading size="md">Transaction History</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack align="stretch" spacing={3}>
                            {transactions.map((tx, index) => (
                                <Flex key={index} align="center" justify="space-between">
                                    <HStack spacing={2}>
                                        <Text fontSize="medium">
                                            {tx.type === 'childGauge' ? 'Child Gauge' : 'Root Gauge'}:
                                        </Text>
                                        {tx.address && (
                                            <Text fontWeight="medium" >
                                                {tx.address}
                                            </Text>
                                        )}
                                    </HStack>
                                    <HStack spacing={4}>
                                        <Button
                                            as="a"
                                            href={getExplorerUrl(selectedNetwork, tx.hash)}
                                            target="_blank"
                                            variant="link"
                                            rightIcon={<ExternalLinkIcon />}
                                            size="sm"
                                        >
                                            {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                                        </Button>

                                        <Badge
                                            colorScheme={tx.status === 'success' ? 'green' : 'orange'}
                                        >
                                            {tx.status}
                                        </Badge>
                                    </HStack>
                                </Flex>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>
            )}
        </Container>
    );
}
