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
    PopoverBody, VStack, Center, UnorderedList, OrderedList, HStack, Badge,
} from "@chakra-ui/react";
import {useAccount, useSwitchChain} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { GetPoolsDocument, GetPoolsQuery, GetPoolsQueryVariables } from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import {GAUGE_WEIGHT_CAPS, MAINNET_GAUGE_FACTORY, NETWORK_OPTIONS} from "@/constants/constants";
import { ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";
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

    const toast = useToast();
    const { address } = useAccount();
    const { openConnectModal } = useConnectModal();

    const { chains, switchChain } = useSwitchChain()

    const { loading, error, data } = useQuery<GetPoolsQuery, GetPoolsQueryVariables>(
        GetPoolsDocument,
        {
            variables: { chainIn: [selectedNetwork as any] },
            skip: !selectedNetwork,
        }
    );

    const filteredPools = useMemo(() => {
        if (!data?.poolGetPools) return [];
        return data.poolGetPools.filter(
            (pool) =>
                pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pool.address.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [data?.poolGetPools, searchTerm]);

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
        const rootGaugeFactory = addressBook.active["mainnet"]?.[`${network}-root-gauge-factory`]?.["RootGaugeFactory"];
        if (typeof rootGaugeFactory === "string") {
            return rootGaugeFactory;
        } else if (rootGaugeFactory && typeof rootGaugeFactory === "object") {
            return Object.values(rootGaugeFactory)[0] || "";
        }
        return "";
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

    const createRootGauge = async () => {
        if (!selectedPool || !address) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const childGaugeAddress = transactions.find(t => t.type === 'childGauge')?.address;
            if (!childGaugeAddress) throw new Error("Child gauge address not found");

            const rootFactory = getRootGaugeFactoryForNetwork(selectedNetwork);
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
        } catch (error) {
            toast({
                title: "Error creating root gauge",
                description: 'There was an error creating gauge, check transaction logs.',
                status: "error",
                duration: 5000,
            });
        }
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
                                        <VStack align="stretch" spacing={3}>
                                            <Input
                                                placeholder="Search pools..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {loading ? (
                                                <Center><Spinner /></Center>
                                            ) : error ? (
                                                <Alert status="error">
                                                    <AlertIcon />
                                                    <AlertDescription>{error.message}</AlertDescription>
                                                </Alert>
                                            ) : (
                                                <List maxH="200px" overflowY="auto">
                                                    {filteredPools.map((pool) => (
                                                        <ListItem
                                                            key={pool.address}
                                                            onClick={() => setSelectedPool(pool as unknown as Pool)}
                                                            cursor="pointer"
                                                            _hover={{ bg: "gray.100" }}
                                                            p={2}
                                                            borderRadius="md"
                                                        >
                                                            {pool.name} - {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
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
                                        <Button
                                            mt={2}
                                            variant="primary"
                                            onClick={createChildChainGauge}
                                            isDisabled={!address || activeStep > 0}
                                        >
                                            Create Child Gauge
                                        </Button>
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
                                            isDisabled={!address || activeStep !== 1}
                                        >
                                            Create Root Gauge
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
                                        <Text fontWeight="medium">
                                            {tx.type === 'childGauge' ? 'Child Gauge' : 'Root Gauge'}:
                                        </Text>
                                        <Button
                                            as="a"
                                            href={`https://etherscan.io/tx/${tx.hash}`}
                                            target="_blank"
                                            variant="link"
                                            rightIcon={<ExternalLinkIcon />}
                                            size="sm"
                                        >
                                            {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                                        </Button>
                                    </HStack>
                                    <HStack spacing={4}>
                                        {tx.address && (
                                            <Text fontSize="sm" color="gray.600">
                                                Gauge: {tx.address.substring(0, 6)}...{tx.address.substring(tx.address.length - 4)}
                                            </Text>
                                        )}
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
