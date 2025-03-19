"use client";
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
  Text,
  Card,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  AttachmentIcon
} from "@chakra-ui/icons";
import Papa from 'papaparse';
import React, { useState, useRef } from "react";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  generateKillGaugePayload,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import { VscGithubInverted } from "react-icons/vsc";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import OpenPRButton from "@/components/btns/OpenPRButton";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";

export default function KillGaugePage() {
  const [gauges, setGauges] = useState<{ id: string }[]>([{ id: "" }]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [autoGeneratePayload, setAutoGeneratePayload] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleGenerateClick = () => {
    let payload = generateKillGaugePayload(gauges.map(g => ({ target: g.id })));
    let text = ""; // According to the provided snippet
    setGeneratedPayload(JSON.stringify(payload, null, 4)); // Beautify JSON string
    setHumanReadableText(text);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingCsv(true);
    setUploadedFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          // Check if there are parse errors
          if (results.errors && results.errors.length > 0) {
            throw new Error(`CSV parsing error: ${results.errors[0].message}`);
          }

          // Check if we have data
          if (!results.data || results.data.length === 0) {
            throw new Error('The CSV file appears to be empty');
          }

          // Type-cast the data array to work with it safely
          const typedData = results.data as Array<Record<string, unknown>>;

          // Check for Root Gauge column presence
          const firstRow = typedData[0];
          const columns = Object.keys(firstRow);

          // Find the Root Gauge column (case-insensitive)
          const rootGaugeColumn = columns.find(col =>
            col.toLowerCase().trim() === 'root gauge'
          );

          if (!rootGaugeColumn) {
            throw new Error('Could not find "Root Gauge" column in the CSV');
          }

          // Extract all root gauge values
          const rootGauges = typedData
            .map(row => String(row[rootGaugeColumn] || '').trim())
            .filter(gauge => gauge !== '');

          // Update gauges state with values from CSV
          if (rootGauges.length > 0) {
            setGauges(rootGauges.map(id => ({ id })));

            toast({
              title: "CSV processed successfully",
              description: `Found ${rootGauges.length} gauge IDs in the CSV file`,
              status: "success",
              duration: 5000,
              isClosable: true,
            });

            // Automatically generate the payload if enabled
            if (autoGeneratePayload && rootGauges.length > 0) {
              let payload = generateKillGaugePayload(rootGauges.map(id => ({ target: id })));
              setGeneratedPayload(JSON.stringify(payload, null, 4));
              toast({
                title: "Payload generated",
                description: `Generated payload for ${rootGauges.length} gauge IDs`,
                status: "info",
                duration: 3000,
                isClosable: true,
              });
            }
          } else {
            toast({
              title: "No gauge IDs found",
              description: "The CSV file doesn't contain any valid gauge IDs",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (error) {
          toast({
            title: "Error processing CSV",
            description: error instanceof Error ? error.message : "Unknown error occurred",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsProcessingCsv(false);
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsProcessingCsv(false);
      }
    });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getPrefillValues = () => {
    // Only include gauges with non-empty IDs
    const validGauges = gauges.filter(g => g.id.trim());
    if (validGauges.length === 0) return {};

    // Generate a unique ID for the branch and file
    const uniqueId = generateUniqueId();

    // Get first gauge ID for naming (truncated to 8 chars)
    const firstGaugeId = validGauges[0].id.substring(0, 8);

    // For description, include first few gauge IDs (up to 3) if there are many
    let gaugeIdsList = "";
    if (validGauges.length <= 3) {
      // If 3 or fewer gauges, show all IDs
      gaugeIdsList = validGauges.map(g => g.id.substring(0, 8)).join(', ');
    } else {
      // If more than 3, show the first 3 and indicate there are more
      gaugeIdsList = validGauges.slice(0, 3).map(g => g.id.substring(0, 8)).join(', ') +
        ` and ${validGauges.length - 3} more`;
    }

    return {
      prefillBranchName: `feature/kill-gauges-${firstGaugeId}-${uniqueId}`,
      prefillPrName: `Kill ${validGauges.length} Gauge${validGauges.length !== 1 ? 's' : ''} from the veBAL system`,
      prefillDescription: `This PR removes ${validGauges.length} gauge${validGauges.length !== 1 ? 's' : ''} (${gaugeIdsList}) from the veBAL system.`,
      prefillFilePath: `BIPs/kill-gauges-${firstGaugeId}-${uniqueId}.json`
    };
  };


  return (
    <Container maxW="container.lg">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Create Gauge Removal Payload
        </Heading>
      </Box>
      <Alert status="info" mt={4} mb={4}>
        <Box flex="1">
          <Flex align={"center"}>
            <AlertIcon />
            <AlertTitle>Hints</AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <List spacing={2}>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Build a payload to disable a gauge for BAL rewards by providing a set of gauge
                contract IDs.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Upload a CSV file containing gauge data to automatically populate gauge IDs. At minimum, a column labeled "Root Gauge" has to be present for successful parsing.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Ensure that the gauge contracts are no longer needed before removing them.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                After submitting a PR, validate that the gauges match the ones that are desired to
                be removed.
              </ListItem>
            </List>
          </AlertDescription>
        </Box>
      </Alert>

      {/* CSV Upload Section */}
      <Card mb="20px" p="15px">
        <Box>
          <Text fontSize="lg" fontWeight="medium" mb="10px">
            Upload Gauge Data CSV
          </Text>
          <Flex direction="column" gap="10px">
            <Flex alignItems="center">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                ref={fileInputRef}
              />
              <Button
                onClick={triggerFileUpload}
                leftIcon={<AttachmentIcon />}
                isLoading={isProcessingCsv}
                loadingText="Processing"
                variant="outline"
                mr="10px"
              >
                {uploadedFileName ? "Change File" : "Upload CSV"}
              </Button>
              {uploadedFileName && (
                <Text fontSize="sm" color="gray.600">
                  {uploadedFileName}
                </Text>
              )}
            </Flex>

            <Flex alignItems="center">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="auto-generate" mb="0" fontSize="sm">
                  Auto-generate payload after CSV upload
                </FormLabel>
                <input
                  id="auto-generate"
                  type="checkbox"
                  checked={autoGeneratePayload}
                  onChange={(e) => setAutoGeneratePayload(e.target.checked)}
                  style={{ marginLeft: '8px' }}
                />
              </FormControl>
            </Flex>
          </Flex>
        </Box>
      </Card>

      {/* Gauge Summary Section - visible when gauges are loaded from CSV */}
      {uploadedFileName && gauges.length > 0 && (
        <Card mb="20px" p="15px">
          <Box>
            <Text fontSize="lg" fontWeight="medium" mb="10px">
              Loaded Gauge Summary
            </Text>
            <Text fontSize="sm" mb="8px">
              {gauges.length} gauge{gauges.length !== 1 ? 's' : ''} loaded from CSV
            </Text>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => {
                setGauges([{ id: "" }]);
                setUploadedFileName(null);
                setGeneratedPayload(null);
              }}
              mb="10px"
            >
              Clear All Gauges
            </Button>
          </Box>
        </Card>
      )}

      {/* Manual Gauge Entry Section */}
      <>
        {gauges.map((gauge, index) => (
          <Card key={"kill-card" + index} mb="10px">
            <Box key={index} display="flex" alignItems="flex-end">
              <FormControl mr="10px" flex="1">
                <FormLabel>Root Gauge ID #{index + 1}</FormLabel>
                <Input
                  value={gauge.id}
                  onChange={e => {
                    const updatedGauges = [...gauges];
                    updatedGauges[index].id = e.target.value;
                    setGauges(updatedGauges);
                  }}
                />
              </FormControl>

              <Box mb="4px">
                <IconButton
                  icon={<DeleteIcon />}
                  onClick={() => {
                    const updatedGauges = [...gauges];
                    updatedGauges.splice(index, 1);
                    setGauges(updatedGauges);
                  }}
                  aria-label={"Delete"}
                />
              </Box>
            </Box>
          </Card>
        ))}
        <Button onClick={() => setGauges([...gauges, { id: "" }])} leftIcon={<AddIcon />}>
          Add Gauge ID
        </Button>
      </>
      <>
        <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
          <Button variant="primary" onClick={handleGenerateClick}>
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
        </Flex>
        <Divider />

        {generatedPayload && (
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={newJson => setGeneratedPayload(newJson)}
          />
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
            mr="10px"
            leftIcon={<CopyIcon />}
            onClick={() => copyJsonToClipboard(generatedPayload, toast)}
          >
            Copy Payload to Clipboard
          </Button>
          <OpenPRButton onClick={handleOpenPRModal} />
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
              onClick={() => copyTextToClipboard(humanReadableText, toast)}
            >
              Copy Text to Clipboard
            </Button>
          </Box>
        )}
      </>
      {/* Spacer at the bottom */}
      <Box mt={8} />
      <PRCreationModal
        type={"kill-gauge"}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
        {...getPrefillValues()}
      />
    </Container>
  );
}
