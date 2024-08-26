'use client'
import React, {useState} from "react";
import dynamic from 'next/dynamic';
import {
    Box,
    Button,
    Card,
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
    useColorMode, useDisclosure,
    useToast,
} from '@chakra-ui/react';
import {AddIcon, CopyIcon, DeleteIcon, DownloadIcon} from "@chakra-ui/icons";
import {CCTPBridgeInput, generateCCTPBridgePayload, generateHumanReadableCCTPBridge,} from "../payloadHelperFunctions";
import {VscGithubInverted} from "react-icons/vsc";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import {PRCreationModal} from "@/components/modal/PRModal";

const ReactJson = dynamic(() => import('react-json-view'), {ssr: false});

const DOMAIN_OPTIONS = [
    {label: 'Ethereum', value: '0'},
    {label: 'Avalanche', value: '1'},
    {label: 'Optimism', value: '2'},
    {label: 'Arbitrum', value: '3'},
    {label: 'Base', value: '6'},
    {label: 'Polygon PoS', value: '7'}
];

const addressMapping: { [key: string]: string } = {
    '0': '0xc38c5f97B34E175FFd35407fc91a937300E33860', // Ethereum
    '1': '0x326A7778DB9B741Cb2acA0DE07b9402C7685dAc6', // Avalanche
    '2': '0x09Df1626110803C7b3b07085Ef1E053494155089', // Optimism
    '3': '0xc38c5f97B34E175FFd35407fc91a937300E33860', // Arbitrum
    '6': '0x65226673F3D202E0f897C862590d7e1A992B2048', // Base
    '7': '0xc38c5f97B34E175FFd35407fc91a937300E33860',  // Polygon
};

export default function CCIPBridge() {
    const {colorMode} = useColorMode();
    const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
    const [inputs, setInputs] = useState<CCTPBridgeInput[]>([{value: 0, destinationDomain: '0', mintRecipient: ''}]);
    const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
    const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

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

    const handleInputChange = (index: number, field: string, value: string | number) => {
        const updatedInputs = [...inputs];
        (updatedInputs[index] as any)[field] = value;
        if (field === 'destinationDomain') {
            (updatedInputs[index] as any).mintRecipient = addressMapping[value as string] || '';
        }
        setInputs(updatedInputs);
    };

    const addInput = () => {
        setInputs([...inputs, {value: 0, destinationDomain: '0', mintRecipient: ''}]);
    };

    const handleRemoveInput = (index: number) => {
        const updatedInputs = [...inputs];
        updatedInputs.splice(index, 1);
        setInputs(updatedInputs);
    };

    const handleGenerateClick = () => {
        let payload = generateCCTPBridgePayload(inputs);
        let text = generateHumanReadableCCTPBridge(inputs);
        setGeneratedPayload(JSON.stringify(payload, null, 4));  // Beautify JSON string
        setHumanReadableText(text);
    };

    const handleDownloadClick = (payload: any) => {
        if (typeof window !== 'undefined' && window.document) {
            const payloadString = JSON.stringify(JSON.parse(payload), null, 2);
            const blob = new Blob([payloadString], {type: 'application/json'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'BIP-XXX.json';
            link.click();
            URL.revokeObjectURL(link.href);
        }
    };

    const copyJsonToClipboard = (payload: any) => {
        const payloadString = JSON.stringify(JSON.parse(payload), null, 2);
        navigator.clipboard.writeText(payloadString).then(() => {
            toast({
                title: "Copied to clipboard!",
                status: "success",
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
                title: "Copied to clipboard!",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <Container maxW="container.lg">
            <Box mb='10px'>
                <Heading as="h2" size="lg" variant="special">Create Bridge Transaction</Heading>
                <Text mb={4}>Further logic for creating a CCIP payment goes here.</Text>
            </Box>
            <Box>
                {inputs.map((input, index) => (
                    <Card key={'bridge-card'+ index} mb='10px'>
                        <Box key={index} mb="10px">
                            <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
                                <FormControl>
                                    <FormLabel>Token</FormLabel>
                                    <Select value="USDC" isDisabled>
                                        <option value="USDC">USDC</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Amount #{index + 1}</FormLabel>
                                    <Input
                                        type="number"
                                        value={input.value}
                                        onChange={(e) => handleInputChange(index, "value", Number(e.target.value))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Destination Domain</FormLabel>
                                    <Select
                                        value={input.destinationDomain}
                                        onChange={(e) => handleInputChange(index, "destinationDomain", e.target.value)}
                                    >
                                        {DOMAIN_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Mint Recipient #{index + 1}</FormLabel>
                                    <Input
                                        value={input.mintRecipient}
                                        onChange={(e) => handleInputChange(index, "mintRecipient", e.target.value)}
                                    />
                                </FormControl>
                            </SimpleGrid>
                            <Flex justifyContent="flex-end" mt={2}>
                                <IconButton
                                    icon={<DeleteIcon/>}
                                    onClick={() => handleRemoveInput(index)}
                                    aria-label="Remove"
                                />
                            </Flex>
                        </Box>
                    </Card>
                ))}
                <Button
                    variant="secondary"
                    onClick={addInput}
                    leftIcon={<AddIcon/>}
                >
                    Add Input
                </Button>
            </Box>
            <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
                <Button
                    variant="primary"
                    onClick={handleGenerateClick}
                >
                    Generate Payload
                </Button>
                {generatedPayload && (
                    <SimulateTransactionButton batchFile={generatedPayload} />
                )}
            </Flex>
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
                    variant="secondary"
                    mr="10px"
                    leftIcon={<DownloadIcon/>}
                    onClick={() => handleDownloadClick(generatedPayload)}
                >
                    Download Payload
                </Button>
                <Button
                    variant="secondary"
                    mr="10px"
                    leftIcon={<CopyIcon/>}
                    onClick={() => copyJsonToClipboard(generatedPayload)}
                >
                    Copy Payload to Clipboard
                </Button>
                <Button
                    variant="secondary"
                    leftIcon={<VscGithubInverted/>}
                    onClick={() => handleOpenPRModal()}
                >
                    Open PR
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
                        leftIcon={<CopyIcon/>}
                        onClick={() => copyTextToClipboard(humanReadableText)}
                    >
                        Copy Text to Clipboard
                    </Button>
                </Box>
            )}
            {/* Spacer at the bottom */}
            <Box mt={8}/>
            <PRCreationModal
                type={"ccip-bridge"}
                isOpen={isOpen}
                onClose={onClose}
                payload={generatedPayload ? JSON.parse(generatedPayload) : null}
            />
        </Container>
    );
}
