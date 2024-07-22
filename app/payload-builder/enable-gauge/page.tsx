'use client'
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
    Heading,
    IconButton,
    Input,
    List,
    ListIcon,
    ListItem,
    Select,
    Text,
    Card,
    useColorMode,
    useToast,
} from '@chakra-ui/react';
import {AddIcon, ChevronRightIcon, CopyIcon, DeleteIcon, DownloadIcon} from "@chakra-ui/icons";
import {useState} from "react";
import {
    copyJsonToClipboard,
    copyTextToClipboard,
    generateEnableGaugePayload,
    generateHumanReadableForEnableGauge,
    handleDownloadClick
} from "@/app/payload-builder/payloadHelperFunctions";
import {NETWORK_OPTIONS} from "@/app/payload-builder/constants";
import dynamic from "next/dynamic";

const ReactJson = dynamic(() => import("react-json-view"), {
    ssr: false
})

export default function EnableGaugePage() {

    const {colorMode} = useColorMode();
    const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
    const [gauges, setGauges] = useState<{ id: string; network: string }[]>([{id: '', network: 'Ethereum'}]);
    const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
    const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
    const toast = useToast();

    const handleGenerateClick = () => {
        let payload = generateEnableGaugePayload(gauges.map(g => ({gauge: g.id, gaugeType: g.network})));
        let text = generateHumanReadableForEnableGauge(gauges.map(g => ({gauge: g.id, gaugeType: g.network})));

        setGeneratedPayload(JSON.stringify(payload, null, 4));  // Beautify JSON string
        setHumanReadableText(text);
    };

    return (
        <Container maxW="container.md">
            <Box mb='10px'>
                <Heading as="h2" size="lg" variant="special">Enable Gauge Payload Builder</Heading>
            </Box>
            <Alert status="info" mt={4} mb={4}>
                <Box flex="1">
                    <Flex
                        align={"center"}
                    >
                        <AlertIcon/>
                        <AlertTitle> Hints</AlertTitle>
                    </Flex>
                    <AlertDescription display="block">
                        <List spacing={2}>
                            <ListItem>
                                <ListIcon as={ChevronRightIcon}/>
                                Build a payload to enable a gauge for BAL rewards by providing a set of gauge contracts
                                and target chains.
                            </ListItem>
                            <ListItem>
                                <ListIcon as={ChevronRightIcon}/>
                                Please make sure to always provide the RootGauge contract from Ethereum Mainnet. Select
                                the target chain accordingly.
                            </ListItem>
                            <ListItem>
                                <ListIcon as={ChevronRightIcon}/>
                                After submitting a PR, make sure the gauge setup is correct and validate the report
                                outputs.
                            </ListItem>
                        </List>
                    </AlertDescription>
                </Box>
            </Alert>
            <>
                {gauges.map((gauge, index) => (
                    <Card key={'enableGauge-card'+ index} mb='10px'>
                    <Box
                        key={index}
                        display="flex"
                        alignItems="flex-end"
                    >

                        <FormControl mr="10px" flex="1">
                            <FormLabel>Gauge ID #{index + 1}</FormLabel>
                            <Input
                                value={gauge.id}
                                onChange={(e) => {
                                    const updatedGauges = [...gauges];
                                    updatedGauges[index].id = e.target.value;
                                    setGauges(updatedGauges);
                                }}
                            />
                        </FormControl>

                        <FormControl mr="10px" width="200px">
                            <FormLabel>Network</FormLabel>
                            <Select
                                value={gauge.network}
                                onChange={(e) => {
                                    const updatedGauges = [...gauges];
                                    updatedGauges[index].network = e.target.value;
                                    setGauges(updatedGauges);
                                }}
                            >
                                {NETWORK_OPTIONS.map((net) => (
                                    <option key={net.label} value={net.label}>
                                        {net.label}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <Box>
                            <IconButton
                                icon={<DeleteIcon/>}
                                onClick={() => {
                                    const updatedGauges = [...gauges];
                                    updatedGauges.splice(index, 1);
                                    setGauges(updatedGauges);
                                }}
                                aria-label={'Delete'}
                            />
                        </Box>

                    </Box>
                    </Card>
                ))}
                <Button
                    variant="secondary"
                    onClick={() =>
                        setGauges([...gauges, {id: "", network: "Ethereum"}])
                    }
                    leftIcon={<AddIcon/>}
                >
                    Add Gauge ID
                </Button>
            </>
            <>
                <Box mt="20px">
                    <Button
                        variant="primary"
                        mb="10px"
                        onClick={handleGenerateClick}
                    >
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
                        variant="secondary"
                        mr="10px"
                        leftIcon={<DownloadIcon/>}
                        onClick={() => handleDownloadClick(generatedPayload)}
                    >
                        Download Payload
                    </Button>
                    <Button
                        variant="secondary"
                        leftIcon={<CopyIcon/>}
                        onClick={() => copyJsonToClipboard(generatedPayload, toast)}
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
                            leftIcon={<CopyIcon/>}
                            onClick={() => copyTextToClipboard(humanReadableText, toast)}>
                            Copy Text to Clipboard
                        </Button>
                    </Box>
                )}
            </>
            {/* Spacer at the bottom */}
            <Box mt={8}/>
        </Container>
    );
};
