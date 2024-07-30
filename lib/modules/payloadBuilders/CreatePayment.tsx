'use client'
import React, {useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Button,
    Container,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    IconButton,
    Input,
    Select,
    SimpleGrid,
    Text,
    Card,
    useColorMode,
    useToast,
} from '@chakra-ui/react';
import {AddIcon, CopyIcon, DeleteIcon, DownloadIcon} from '@chakra-ui/icons';
import {
    generateHumanReadableTokenTransfer,
    generateTokenPaymentPayload,
    PaymentInput, transformToHumanReadable
} from "@/app/payload-builder/payloadHelperFunctions";
import {AddressBook} from "@/lib/config/types/interfaces";
import {getCategoryData, getNetworks} from "@/lib/shared/data/maxis/addressBook";
import {WHITELISTED_PAYMENT_TOKENS} from "@/app/payload-builder/constants";

const ReactJson = dynamic(() => import('react-json-view'), {ssr: false});

interface CreatePaymentProps {
    addressBook: AddressBook;
}

export default function CreatePaymentContent({ addressBook }: CreatePaymentProps) {
    const {colorMode} = useColorMode();
    const reactJsonTheme = colorMode === 'light' ? 'rjv-default' : 'solarized';
    const [payments, setPayments] = useState<PaymentInput[]>([]);
    const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
    const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
    const toast = useToast();

    const [selectedNetwork, setSelectedNetwork] = useState<string>('mainnet');
    const [selectedMultisig, setSelectedMultisig] = useState<string>('');
    const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);
    const [availableMultisigs, setAvailableMultisigs] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const networks = getNetworks(addressBook);
        setAvailableNetworks(networks);
        if (networks.length > 0) {
            setSelectedNetwork(networks[0]);
        }
    }, [addressBook]);

    useEffect(() => {
        const multisigs = getCategoryData(addressBook, selectedNetwork, 'multisigs');

        if (multisigs && typeof multisigs === 'object') {
            const formattedMultisigs: { [key: string]: string } = {};
            Object.entries(multisigs).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    formattedMultisigs[key] = value;
                }
            });
            setAvailableMultisigs(formattedMultisigs);
        } else {
            setAvailableMultisigs({});
        }

        setSelectedMultisig('');
    }, [selectedNetwork, addressBook]);


    const handleRemovePayment = (index: number) => {
        const newPayments = [...payments];
        newPayments.splice(index, 1);
        setPayments(newPayments);
    };

    const handleGenerateClick = () => {
        const safeInfo = {
            address: selectedMultisig,
            network: selectedNetwork
        };
        const payload = generateTokenPaymentPayload(payments, safeInfo);
        const text = payments.map(payment => generateHumanReadableTokenTransfer(payment, safeInfo)).join('\n');
        setGeneratedPayload(JSON.stringify(payload, null, 4));
        setHumanReadableText(text);
    };

    const handleDownloadClick = (payload: any) => {
        if (typeof window !== 'undefined' && window.document) {
            const payloadString = JSON.stringify(JSON.parse(payload), null, 2);
            const blob = new Blob([payloadString], {type: 'application/json'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'BIP-XXX-payment.json';
            link.click();
            URL.revokeObjectURL(link.href);
        }
    };

    const copyJsonToClipboard = (payload: any) => {
        const payloadString = JSON.stringify(JSON.parse(payload), null, 2);
        navigator.clipboard.writeText(payloadString).then(() => {
            toast({
                title: 'Copied to clipboard!',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    const copyTextToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: 'Copied to clipboard!',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <Container maxW="container.md">
            <Box mb='10px'>
                <Heading as="h2" size="lg" variant="special">Create DAO Payment</Heading>
                <Text mt={4}>Build a payment payload to send tokens from the DAO multi-sig to a destination address of your choosing.</Text>
            </Box>
            <Box>
                <Box mb={2} mt={2}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                        <FormLabel>Select Network</FormLabel>
                        <Select
                            value={selectedNetwork}
                            onChange={(e) => setSelectedNetwork(e.target.value)}
                        >
                            {availableNetworks.map((network) => (
                                <option key={network} value={network}>{network.toUpperCase()}</option>
                            ))}
                        </Select>
                    </FormControl>
                </SimpleGrid>
                </Box>
                {payments.map((payment, index) => (
                    <Box key={index} mb="10px">
                        <Card>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FormControl>
                                    <FormLabel>Multisig</FormLabel>
                                    <Select
                                        value={selectedMultisig}
                                        onChange={(e) => setSelectedMultisig(e.target.value)}
                                    >
                                        {Object.entries(availableMultisigs).map(([name, address]) => (
                                            <option key={address} value={address}>
                                                {transformToHumanReadable(name)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Token</FormLabel>
                                    <Select
                                        value={payment.token}
                                        onChange={(e) => {
                                            const updatedPayments = [...payments];
                                            updatedPayments[index].token = e.target.value;
                                            setPayments(updatedPayments);
                                        }}
                                    >
                                        {WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.map((token) => (
                                            <option key={token.address} value={token.address}>{token.symbol}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Amount #{index + 1}</FormLabel>
                                    <Input
                                        type="number"
                                        value={payment.value}
                                        onChange={(e) => {
                                            const updatedPayments = [...payments];
                                            updatedPayments[index].value = Number(e.target.value);
                                            setPayments(updatedPayments);
                                        }}
                                    />
                                </FormControl>
                            </SimpleGrid>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                                <FormControl>
                                    <FormLabel>Recipient Address #{index + 1}</FormLabel>
                                    <Input
                                        value={payment.to}
                                        onChange={(e) => {
                                            const updatedPayments = [...payments];
                                            updatedPayments[index].to = e.target.value;
                                            setPayments(updatedPayments);
                                        }}
                                    />
                                </FormControl>
                                <Flex alignItems="flex-end" justifyContent="flex-end">
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        onClick={() => handleRemovePayment(index)}
                                        aria-label="Remove"
                                    />
                                </Flex>
                            </SimpleGrid>
                        </Card>
                    </Box>
                ))}
                <Button
                    variant="secondary"
                    onClick={() =>
                        setPayments([...payments, { to: '', value: 0, token: WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.[0]?.address || '' }])
                    }
                    leftIcon={<AddIcon />}
                >
                    Add Payment
                </Button>
            </Box>
            <Box mt="20px">
                <Button
                    variant="primary"
                    mb="10px"
                    onClick={handleGenerateClick}
                >
                    Generate Payload
                </Button>
            </Box>
            <Divider />

            {generatedPayload && (
                <Box mt="20px">
                    <Text fontSize="lg" mb="10px">
                        Generated JSON Payload:
                    </Text>
                    <ReactJson theme={reactJsonTheme} src={JSON.parse(generatedPayload)} />
                </Box>
            )}

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
                    leftIcon={<CopyIcon />}
                    onClick={() => copyJsonToClipboard(generatedPayload)}
                >
                    Copy Payload to Clipboard
                </Button>
            </Box>

            {humanReadableText && (
                <Box mt="20px">
                    <Text fontSize="2xl">Human-readable Text</Text>
                    <Box p="20px" mb="20px" borderWidth="1px" borderRadius="lg">
                        <Text>{humanReadableText}</Text>
                    </Box>
                    <Button
                        variant="secondary"
                        leftIcon={<CopyIcon />}
                        onClick={() => copyTextToClipboard(humanReadableText)}
                    >
                        Copy Text to Clipboard
                    </Button>
                </Box>
            )}
            <Box mt={8} />
        </Container>
    );
}
