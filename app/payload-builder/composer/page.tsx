"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Text,
  VStack,
  Box,
  List,
  ListItem,
  ListIcon,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { IoLayers } from "react-icons/io5";
import { Settings } from "react-feather";
import { FiZap } from "react-icons/fi";
import ComposerOperationsPreview from "./ComposerOperationsPreview";
import ComposerPayloadViewer from "./ComposerPayloadViewer";
import ComposersummaryOverview from "./ComposerSummaryOverview";
import { useComposer } from "./PayloadComposerContext";

export default function ComposerPage() {
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const { operations } = useComposer();
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  // Reset manual edits when operations change (since payload will be regenerated)
  useEffect(() => {
    if (hasManualEdits) {
      setHasManualEdits(false);
    }
  }, [operations]);

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h2" size="lg" variant="special" mb={2}>
            Payload Composer
          </Heading>
          <Text color={mutedTextColor} fontSize="md">
            Combine multiple payload operations into a single transaction
          </Text>
        </Box>

        {/* How it Works */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            How It Works
          </Heading>
          <List spacing={3}>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={IoLayers} color="blue.500" />
              <Text>
                <Text as="span" fontWeight="semibold">
                  Add to Composer:
                </Text>{" "}
                Visit any payload builder and click "Add to Composer" to collect operations
              </Text>
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={Settings} color="green.500" />
              <Text>
                <Text as="span" fontWeight="semibold">
                  Manage & Reorder:
                </Text>{" "}
                View, reorder, and manage your operations in the preview below
              </Text>
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={FiZap} color="purple.500" />
              <Text>
                <Text as="span" fontWeight="semibold">
                  Execute:
                </Text>{" "}
                Combine all operations into a single transaction and execute via Safe
              </Text>
            </ListItem>
          </List>
        </Box>

        <Divider />

        <ComposersummaryOverview />

        {/* Operations Management with Reordering */}
        <ComposerOperationsPreview hasManualEdits={hasManualEdits} />

        <Divider />

        {/* Combined Stats and Execution */}
        <VStack spacing={4} align="stretch">
          {/* Execution interface with JSON editor and buttons */}
          <ComposerPayloadViewer
            hasManualEdits={hasManualEdits}
            setHasManualEdits={setHasManualEdits}
          />
        </VStack>
      </VStack>
    </Container>
  );
}
