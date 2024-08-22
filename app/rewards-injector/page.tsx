"use client";
import React, {useEffect, useState} from "react";
import {
    Button, Card, CardBody,
    Container,
    Flex,
    FormControl,
    FormLabel, Heading,
    Image,
    Menu,
    MenuButton,
    MenuItem,
    MenuList, SimpleGrid,
    Spinner, Stack,
    Switch,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";

import {ethers} from "ethers";
import {InjectorABIV1} from "@/abi/InjectorV1";
import {ERC20} from "@/abi/erc20";
import {poolsABI} from "@/abi/pool";
import {gaugeABI} from "@/abi/gauge";
import {ChevronDownIcon} from "@chakra-ui/icons";
import {networks} from "@/constants/constants";
import {RewardsInjectorTable} from "@/components/tables/RewardsInjectorTable";

type AddressOption = {
    network: string;
    address: string;
    token: string;
};



type Recipient = {
    gaugeAddress: string;
    poolName?: string;
    amountPerPeriod?: string;
    maxPeriods: string,
    periodNumber: string,
    lastInjectionTimeStamp: string
}


const networks: Record<string, NetworkInfo> = {
    mainnet: {logo: MainnetLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=ethereum&dkey="},
    polygon: {logo: PolygonLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=polygon&dkey="},
    optimism: {logo: OptimismLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=optimism&dkey="},
    avalanche: {logo: AvalancheLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=avalanche&dkey="},
    arbitrum: {logo: ArbitrumLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=arbitrum&dkey="},
    gnosis: {logo: GnosisLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=gnosis&dkey="},
    base: {logo: BaseLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=base&dkey="},
    zkevm: {logo: zkevmLogo.src, rpc: "https://lb.drpc.org/ogrpc?network=polygon-zkevm&dkey="}
};

function App() {
    const [addresses, setAddresses] = useState<AddressOption[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
    const [gauges, setGauges] = useState<Recipient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isV2, setIsV2] = useState(false);
    const [tokenName, setTokenName] = useState("");
    const [tokenSymbol, setTokenSymbol] = useState("");

    const handleVersionSwitch = () => {
        setIsV2(!isV2);
        setSelectedAddress(null);
        setGauges([]);
    };

    useEffect(() => {
        if (selectedAddress) {
            fetchInjectorData(selectedAddress.address,selectedAddress.network, selectedAddress.token)
        }
    }, [selectedAddress]);

    const handleAddressSelect = (address: AddressOption) => {
        setSelectedAddress(address);
        fetchInjectorData(address.address, address.network, address.token);

        setIsLoading(true);
    };



    async function fetchInjectorData(address, network, token) {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/injector?address=${address}&network=${network}&token=${token}`);
            const data = await response.json();
            setTokenName(data.tokenInfo.name);
            setTokenSymbol(data.tokenInfo.symbol);
            setGauges(data.gauges);
        } catch (error) {
            console.error("Error fetching injector data:", error);
        }
        setIsLoading(false);
    }


    useEffect(() => {
        fetch("https://raw.githubusercontent.com/BalancerMaxis/bal_addresses/main/outputs/addressbook.json")
            .then((response) => response.json())
            .then((data) => {
                let allAddressesWithOptions = [];
                const activeNetworks = data.active;

                // Iterate over each network and extract gaugeRewardsInjectors addresses
                for (const network in activeNetworks) {
                    const maxiKeepers = activeNetworks[network].maxiKeepers;
                    if (maxiKeepers) {
                        const injectors = isV2 ? maxiKeepers.gaugeRewardsInjectorsV2 : maxiKeepers.gaugeRewardsInjectors;
                        if (injectors) {
                            for (const token in injectors) {
                                const address = injectors[token];
                                allAddressesWithOptions.push({network: network, address: address, token: token});
                            }
                        }
                    }
                }

                setAddresses(allAddressesWithOptions);
            })
            .catch((error) => console.error("Error fetching addresses:", error));
    }, [isV2]);

    const calculateDistributionAmounts = () => {
        let total = 0;
        let distributed = 0;
        let remaining = 0;

        gauges.forEach(gauge => {
            const amount = parseFloat(gauge.amountPerPeriod!) || 0;
            const maxPeriods = parseInt(gauge.maxPeriods) || 0;
            const currentPeriod = parseInt(gauge.periodNumber) || 0;

            const gaugeTotal = amount * maxPeriods;
            const gaugeDistributed = amount * currentPeriod;

            total += gaugeTotal;
            distributed += gaugeDistributed;
            remaining += (gaugeTotal - gaugeDistributed);
        });

        return { total, distributed, remaining };
    };

    const formatAmount = (amount : number) => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <Container maxW="container.lg" justifyContent="center" alignItems="center">
                <>
                    <Flex justifyContent="space-between" alignItems="center" mb={4}>
                        <Menu>
                            <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon/>}
                                mb={4}
                                isDisabled={isLoading}
                                w="100%"
                            >
                                {selectedAddress ? (
                                    <Flex alignItems="center">
                                        <Image
                                            src={networks[selectedAddress.network]?.logo}
                                            alt={`${selectedAddress.network} logo`}
                                            boxSize="20px"
                                            mr={2}
                                        />
                                        <Text isTruncated>
                                            {selectedAddress.address} - {selectedAddress.token}
                                        </Text>
                                    </Flex>
                                ) : (
                                    <Text>Select an injector</Text>
                                )}
                            </MenuButton>
                            <MenuList w="135%">
                                {addresses.map((address) => (
                                    <MenuItem
                                        key={address.network + address.token}
                                        onClick={() => handleAddressSelect(address)}
                                        w="100%"
                                    >
                                        <Flex alignItems="center" w="100%">
                                            <Image
                                                src={networks[address.network]?.logo}
                                                alt={`${address.network} logo`}
                                                boxSize="20px"
                                                mr={2}
                                            />
                                            <Text isTruncated>
                                                {address.address} - {address.token}
                                            </Text>
                                        </Flex>
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>

                        <FormControl display="flex" alignItems="center" w="auto" marginLeft={10}>
                            <FormLabel htmlFor="version-switch" mb="0">
                                V1
                            </FormLabel>
                            <Switch
                                size={"lg"}
                                id="version-switch"
                                isChecked={isV2}
                                onChange={handleVersionSwitch}
                            />
                            <FormLabel htmlFor="version-switch" mb="0" ml={2}>
                                V2
                            </FormLabel>
                        </FormControl>
                    </Flex>

                    {selectedAddress && !isLoading && (
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                            <Card>
                                <CardBody>
                                    <Stack spacing={3}>
                                        <Heading size="md">Total Distribution</Heading>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {formatAmount(calculateDistributionAmounts().total)} {tokenSymbol}
                                        </Text>
                                    </Stack>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody>
                                    <Stack spacing={3}>
                                        <Heading size="md">Distributed</Heading>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {formatAmount(calculateDistributionAmounts().distributed)} {tokenSymbol}
                                        </Text>
                                    </Stack>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody>
                                    <Stack spacing={3}>
                                        <Heading size="md">Remaining</Heading>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {formatAmount(calculateDistributionAmounts().remaining)} {tokenSymbol}
                                        </Text>
                                    </Stack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    )}

                    {isLoading ? (
                        <Flex justifyContent="center" alignItems="center" height="200px">
                            <Spinner size="xl" />
                        </Flex>
                    ) : (
                        <RewardsInjectorTable data={gauges} tokenSymbol={tokenSymbol} />
                    )}
                </>
        </Container>
    );
}

export default App;
