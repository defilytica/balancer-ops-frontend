import React from "react";
import { Box, Heading, Text, SimpleGrid, VStack } from "@chakra-ui/react";
import { PAYLOAD_OPTIONS } from "@/constants/constants";
import CustomCard from "@/components/CustomCard";

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
    "amp-factor-update-v3",
  ],
  "Financial Operations": ["create-payment", "cctp-bridge"],
  "Pool Management (v2)": ["fee-setter", "amp-factor-update-v2"],
  "Permissions and Operations": ["permissions"],
};

const PayloadBuilder = () => {
  const getPayloadByKey = (key: string) => {
    return PAYLOAD_OPTIONS.find(payload => payload.key === key);
  };

  return (
    <Box p={4} maxW="container.xl" mx="auto">
      <Heading as="h2" size="lg" mb={2} variant="special">
        Payload Builder Library
      </Heading>
      <Text mb={4}>Choose from a variety of options to create Balancer DAO Payloads</Text>

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
  );
};

export default PayloadBuilder;
