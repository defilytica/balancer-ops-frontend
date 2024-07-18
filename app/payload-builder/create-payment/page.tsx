'use client'
import React, {useState} from 'react';
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
    useColorMode,
    useToast,
} from '@chakra-ui/react';
import {AddIcon, CopyIcon, DeleteIcon, DownloadIcon} from '@chakra-ui/icons';
import {
    generateHumanReadableTokenTransfer,
    generateTokenPaymentPayload,
    PaymentInput,
} from '../payloadHelperFunctions';

const ReactJson = dynamic(() => import('react-json-view'), {ssr: false});

export default function CreatePaymentPage() {
    const {colorMode} = useColorMode();
    const reactJsonTheme = colorMode === 'light' ? 'rjv-default' : 'solarized';
    const [payments, setPayments] = useState<PaymentInput[]>([]);
    const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
    const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
    const toast = useToast();

    const handleRemovePayment = (index: number) => {
        const newPayments = [...payments];
        newPayments.splice(index, 1);
        setPayments(newPayments);
    };

    const handleGenerateClick = () => {
        const payload = generateTokenPaymentPayload(payments);
        const text = payments.map(payment => generateHumanReadableTokenTransfer(payment)).join('\n');
        setGeneratedPayload(JSON.stringify(payload, null, 4)); // Beautify JSON string
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
                <Heading>Create DAO Payment</Heading>
                <Text mt={4}>Build a payment payload to send USDC or BAL from the DAO multi-sig on mainnet to a
                    destination address of your choosing.</Text>
            </Box>
            <Box>
                {payments.map((payment, index) => (
                    <Box key={index} mb="10px">
                        <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
                            <FormControl>
                                <FormLabel>Token</FormLabel>
                                <Select
                                    value={payment.token}
                                    onChange={(e) => {
                                        const updatedPayments = [...payments];
                                        updatedPayments[index].token = e.target.value as 'USDC' | 'BAL';
                                        setPayments(updatedPayments);
                                    }}
                                >
                                    <option value="USDC">USDC</option>
                                    <option value="BAL">BAL</option>
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
                        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mt={4}>
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
                                    icon={<DeleteIcon/>}
                                    onClick={() => handleRemovePayment(index)}
                                    aria-label="Remove"
                                />
                            </Flex>
                        </SimpleGrid>
                    </Box>
                ))}
                <Button
                    onClick={() =>
                        setPayments([...payments, {to: '', value: 0, token: 'USDC'}])
                    }
                    leftIcon={<AddIcon/>}
                >
                    Add Payment
                </Button>
            </Box>
            <Box mt="20px">
                <Button mb="10px" onClick={handleGenerateClick}>
                    Generate Payload
                </Button>
            </Box>
            <Divider/>

            {generatedPayload && (
                <Box mt="20px">
                    <Text fontSize="lg" mb="10px">
                        Generated JSON Payload:
                    </Text>
                    <ReactJson theme={reactJsonTheme} src={JSON.parse(generatedPayload)}/>
                </Box>
            )}

            <Box display="flex" alignItems="center" mt="20px">
                <Button
                    mr="10px"
                    leftIcon={<DownloadIcon/>}
                    onClick={() => handleDownloadClick(generatedPayload)}
                >
                    Download Payload
                </Button>
                <Button
                    leftIcon={<CopyIcon/>}
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
                        colorScheme="blue"
                        leftIcon={<CopyIcon/>}
                        onClick={() => copyTextToClipboard(humanReadableText)}
                    >
                        Copy Text to Clipboard
                    </Button>
                </Box>
            )}
            {/* Spacer at the bottom */}
            <Box mt={8}/>
        </Container>
    );
}
