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
import PolygonLogo from '@/lib/shared/imgs/polygon.svg'
import OptimismLogo from '@/lib/shared/imgs/optimism.svg'
import ArbitrumLogo from '@/lib/shared/imgs/arbitrum.svg'
import AvalancheLogo from '@/lib/shared/imgs/avalancheLogo.svg'
import GnosisLogo from '@/lib/shared/imgs/gnosis.svg'
import BaseLogo from '@/lib/shared/imgs/base.svg'
import zkevmLogo from '@/lib/shared/imgs/Polygon-zkEVM.png'
import {ethers} from "ethers";
import {InjectorABIV1} from "@/abi/InjectorV1";
import {ERC20} from "@/abi/erc20";
import {poolsABI} from "@/abi/pool";
import {gaugeABI} from "@/abi/gauge";
import {ChevronDownIcon} from "@chakra-ui/icons";

type AddressOption = {
    network: string;
    address: string;
    token: string;
};

type NetworkInfo = {
    logo: string;
    rpc: string;
};

type Recipient = {
    gaugeAddress: string;
    poolName?: string;
    amountPerPeriod?: string;
    maxPeriods: string,
    periodNumber: string,
    lastInjectionTimeStamp: string
}

const tokenDecimals: Record<string, number> = {
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6, // mainnet
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": 6, // polygon
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831": 6, // arbitrum
    "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83": 6, // gnosis
    "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035": 6, // zkevm
    "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": 6, // avalanche
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6, // base
    "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": 6, // base USDbC
    "0x0b2c639c533813f4aa9d7837caf62653d097ff85": 6, // OP USDC
};

const networks: Record<string, NetworkInfo> = {
    polygon: {logo: PolygonLogo.src, rpc: "https://1rpc.io/matic"},
    optimism: {logo: OptimismLogo.src, rpc: "https://mainnet.optimism.io"},
    avalanche: {logo: AvalancheLogo.src, rpc: "https://avalanche.public-rpc.com"},
    arbitrum: {logo: ArbitrumLogo.src, rpc: "https://arb1.arbitrum.io/rpc"},
    gnosis: {logo: GnosisLogo.src, rpc: "https://rpc.gnosischain.com"},
    base: {logo: BaseLogo.src, rpc: "https://mainnet.base.org"},
    zkevm: {logo: zkevmLogo.src, rpc: "https://zkevm-rpc.com"}
}

function App() {
    const [addresses, setAddresses] = useState<AddressOption[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
    const [provider, setProvider] = useState<ethers.JsonRpcProvider>();
    const [contract, setContract] = useState<ethers.Contract>();
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
            getWatchList();
        }
    }, [selectedAddress]);

    const handleAddressSelect = (address: AddressOption) => {
        setSelectedAddress(address);
        const tempProvider = new ethers.JsonRpcProvider(networks[address.network].rpc);
        setProvider(tempProvider);
        setContract(new ethers.Contract(address.address, InjectorABIV1, tempProvider));
        setIsLoading(true);
    };

    async function getAccountInfoForAddress(recipient: Recipient) {
        if (contract) {
            try {
                if (isV2){
                    const result = await contract.getGaugeInfo(recipient.gaugeAddress);
                    recipient.amountPerPeriod = formatTokenAmount(result.amountPerPeriod, selectedAddress!.address);

                    return recipient
                }
                const result = await contract.getAccountInfo(recipient.gaugeAddress);
                console.log(result)
                recipient.amountPerPeriod = formatTokenAmount(result.amountPerPeriod, selectedAddress!.address);
                recipient.maxPeriods = result.maxPeriods.toString();
                recipient.periodNumber = result.periodNumber.toString();
                recipient.lastInjectionTimeStamp = result.lastInjectionTimeStamp.toString();

                return recipient
                /*
                setAccountInfo((prevInfo) => ({...prevInfo, [address]: result}));

                const periodFinish = await fetchPeriodFinish(address);
                setPeriodFinishTimestamps((prevTimestamps) => ({...prevTimestamps, [address]: periodFinish}));

                setEditableData((prevData) => ({
                    ...prevData,
                    [address]: {
                        ...prevData[address],
                        address: address,
                        amountPerPeriod: formattedAmountPerPeriod,
                        maxPeriods: result.maxPeriods.toString(),
                    },
                }));
                 */
            } catch (error) {
                console.error(`Error fetching info for address ${recipient.gaugeAddress}:`, error);
                return recipient
            }
        }
        return recipient
    }

    function formatTokenAmount(amount: any, tokenAddress: string) {
        if (amount === null || amount === undefined) return "Loading...";

        const formattedAmount = BigInt(amount.toString());
        const decimals = tokenDecimals[tokenAddress.toLowerCase()] || 18;

        return ethers.formatUnits(formattedAmount, decimals);
    }

    console.log(gauges);

    async function getWatchList() {
        if (contract) {
            try {
                const result = await contract.getWatchList(); //V2: getActiveGaugeList()
                const newRecipients: Recipient[] = result.map((g: any) => ({
                    gaugeAddress: g,
                }));

                const injectorTokenAddress = await contract.getInjectTokenAddress();
                await fetchTokenInfo(injectorTokenAddress);

                for (let recipient of newRecipients) {
                    recipient.poolName = await fetchPoolName(recipient.gaugeAddress);
                    recipient = await getAccountInfoForAddress(recipient);
                }

                setGauges(newRecipients);
                setIsLoading(false)
            } catch (error) {
                console.error("Error:", error);
                setIsLoading(false)
            }
        }
    }

    async function fetchTokenInfo(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
            const name = await tokenContract.name();
            const symbol = await tokenContract.symbol();
            setTokenName(name);
            setTokenSymbol(symbol);
        } catch (error) {
            console.error("Error fetching token info:", error);
            setTokenName("Unknown");
            setTokenSymbol("???");
        }
    }

    async function fetchPoolName(address: string) {
        try {
            const gaugeContract = new ethers.Contract(address, gaugeABI, provider);
            const gaugeLPTokenAddress = await gaugeContract.lp_token();
            const tokenContract = new ethers.Contract(gaugeLPTokenAddress, poolsABI, provider);
            const poolName = await tokenContract.name();
            return poolName;
        } catch (error) {
            console.error(`Error fetching pool name for address ${address}:`, error);
            return "Unknown Pool";
        }
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

    const formatAmount = (amount : any) => {
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
                                            src={networks[selectedAddress.network].logo}
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
                                                src={networks[address.network].logo}
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
                            <Spinner size="xl"/>
                        </Flex>
                    ) : (
                        <Table variant="simple" w="100%">
                            <Thead>
                                <Tr>
                                    <Th>Address</Th>
                                    <Th>Name</Th>
                                    <Th>Amount Per Period</Th>
                                    <Th>Period Number</Th>
                                    <Th>Max Periods</Th>
                                    <Th>Last Injection</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {gauges.map((gauge) => (
                                    <Tr key={gauge.gaugeAddress}>
                                        <Td>{gauge.gaugeAddress}</Td>
                                        <Td>{gauge.poolName}</Td>
                                        <Td>{gauge.amountPerPeriod}</Td>
                                        <Td>{gauge.periodNumber}</Td>
                                        <Td>{gauge.maxPeriods}</Td>
                                        <Td>{new Date(Number(gauge.lastInjectionTimeStamp) * 1000).toLocaleDateString()}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}
                </>
        </Container>
    );
}

export default App;