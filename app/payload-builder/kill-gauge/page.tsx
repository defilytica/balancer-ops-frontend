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
import { AddIcon, ChevronRightIcon, CopyIcon, DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import React, { useState } from "react";
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

export default function KillGaugePage() {
  const [gauges, setGauges] = useState<{ id: string }[]>([{ id: "" }]);
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

  const handleGenerateClick = () => {
    let payload = generateKillGaugePayload(gauges.map(g => ({ target: g.id })));
    let text = ""; // According to the provided snippet
    setGeneratedPayload(JSON.stringify(payload, null, 4)); // Beautify JSON string
    setHumanReadableText(text);
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
      <>
        {gauges.map((gauge, index) => (
          <Card key={"kill-card" + index} mb="10px">
            <Box key={index} display="flex" alignItems="flex-end">
              <FormControl mr="10px" flex="1">
                <FormLabel>Gauge ID #{index + 1}</FormLabel>
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
      />
    </Container>
  );
}
