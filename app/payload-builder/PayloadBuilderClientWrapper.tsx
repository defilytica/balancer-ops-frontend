"use client";

import { Box, Heading, Text, SimpleGrid, VStack, Flex, Card } from "@chakra-ui/react";
import { PAYLOAD_OPTIONS } from "@/constants/constants";
import CustomCard from "@/components/CustomCard";
import ComposerIndicator from "./composer/ComposerIndicator";
import { PayloadComposerProvider } from "./composer/PayloadComposerContext";

const CATEGORIZED_PAYLOADS = {
  "Gauge Management": ["enable-gauge", "kill-gauge"],
  "Reward Configuration": [
    "add-reward-to-gauge",
    "set-reward-distributor-to-gauge",
    "injector-configurator",
  ],
  "Pool Management (v3)": [
    "initialize-buffer",
    "manage-buffer",
    "fee-setter-v3",
    "protocol-fee-setter-v3",
    "amp-factor-update-v3",
    "reclamm",
  ],
  "Emergency Operations": ["emergency"],
  "Financial Operations": ["create-payment", "cctp-bridge", "spark-psm"],
  "Pool Management (v2)": ["fee-setter", "amp-factor-update-v2"],
  "Permissions and Operations": ["permissions"],
};

export default function PayloadBuilderClientWrapper() {
  const getPayloadByKey = (key: string) => {
    return PAYLOAD_OPTIONS.find(payload => payload.key === key);
  };

  return (
    <PayloadComposerProvider>
      <Box p={4} maxW="container.xl" mx="auto">
        <Box mb={4}>
          <Heading as="h2" size="lg" mb={2} variant="special">
            Payload Builder Library
          </Heading>
          <Text>Choose from a variety of options to create Balancer DAO Payloads</Text>
        </Box>

        <Card boxShadow="md" borderRadius="md" p={6} mb={4}>
          <Flex
            justify="space-between"
            align="center"
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Box>
              <Heading size="md" mb={2} variant="secondary">
                Payload composer
              </Heading>
              <Text fontSize="md">
                Build complex workflows by combining multiple operations into a single transaction.
              </Text>
            </Box>
            <Box width={{ base: "full", md: "auto" }}>
              <ComposerIndicator />
            </Box>
          </Flex>
        </Card>

        <VStack spacing={8} align="stretch">
          {Object.entries(CATEGORIZED_PAYLOADS).map(([category, payloadKeys]) => (
            <Box key={category}>
              <Heading as="h3" size="md" mb={4} pb={2}>
                {category}
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {payloadKeys.map(key => {
                  const payload = getPayloadByKey(key);
                  if (!payload) return null;

                  return (
                    <CustomCard
                      key={payload.key}
                      title={payload.label}
                      description={payload.description}
                      button_label={payload.button_label}
                      icon={<payload.icon />}
                      link={payload.href}
                    />
                  );
                })}
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      </Box>
    </PayloadComposerProvider>
  );
}
