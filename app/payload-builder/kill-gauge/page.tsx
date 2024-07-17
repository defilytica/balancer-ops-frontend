'use client'
import dynamic from 'next/dynamic'
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
    useColorMode,
    useToast,
} from '@chakra-ui/react';
import {AddIcon, ChevronRightIcon, CopyIcon, DeleteIcon, DownloadIcon} from "@chakra-ui/icons";
import {useState} from "react";
import {
    copyJsonToClipboard,
    copyTextToClipboard,
    generateKillGaugePayload,
    generateHumanReadableForEnableGauge,
    handleDownloadClick
} from "@/app/payload-builder/payloadHelperFunctions";
import {NETWORK_OPTIONS} from "@/app/payload-builder/constants";
const ReactJson = dynamic(() => import("react-json-view"), {
    ssr: false
})

export default function KillGaugePage() {



    const { colorMode } = useColorMode();
    const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
    const [gauges, setGauges] = useState<{ id: string }[]>([{ id: '' }]);
    const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
    const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
    const toast = useToast();

    const handleGenerateClick = () => {
        let payload = generateKillGaugePayload(gauges.map(g => ({ target: g.id })));
        let text = ''; // According to the provided snippet
        setGeneratedPayload(JSON.stringify(payload, null, 4));  // Beautify JSON string
        setHumanReadableText(text);
    };

    return (
        <Container maxW="container.md">
            <Box p={4}>
                <Heading>Create Gauge Removal Payload</Heading>
            </Box>
            <Alert status="info" mt={4} mb={4}>
                <Box flex="1" >
                    <Flex align={"center"}>
                        <AlertIcon/>
                        <AlertTitle>Hints</AlertTitle>
                    </Flex>
                    <AlertDescription display="block">
                        <List spacing={2}>
                            <ListItem>
                                <ListIcon as={ChevronRightIcon}/>
                                Build a payload to disable a gauge for BAL rewards by providing a set of gauge contract IDs.
                            </ListItem>
                            <ListItem>
                                <ListIcon as={ChevronRightIcon}/>
                                Ensure that the gauge contracts are no longer needed before removing them.
                            </ListItem>
                            <ListItem>
                                <ListIcon as={ChevronRightIcon}/>
                                After submitting a PR, validate that the gauges match the ones that are desired to be removed.
                            </ListItem>
                        </List>
                    </AlertDescription>
                </Box>
            </Alert>
            <>
                {gauges.map((gauge, index) => (
                    <Box
                        key={index}
                        display="flex"
                        mb="10px"
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

                        <Box mb="4px">
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
                ))}
                <Button
                    onClick={() => setGauges([...gauges, { id: "" }])}
                    leftIcon={<AddIcon />}
                >
                    Add Gauge ID
                </Button>
            </>
            <>
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
                        <ReactJson theme={reactJsonTheme} src={JSON.parse(generatedPayload)} />
                    </Box>
                )}

                <Box display="flex" alignItems="center" mt="20px">
                    <Button
                        mr="10px"
                        leftIcon={<DownloadIcon />}
                        onClick={() => handleDownloadClick(generatedPayload)}
                    >
                        Download Payload
                    </Button>
                    <Button
                        leftIcon={<CopyIcon />}
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
                            colorScheme="blue"
                            leftIcon={<CopyIcon />}
                            onClick={() => copyTextToClipboard(humanReadableText, toast)}
                        >
                            Copy Text to Clipboard
                        </Button>
                    </Box>
                )}
            </>
            {/* Spacer at the bottom */}
            <Box mt={8} />
        </Container>
    );
}
