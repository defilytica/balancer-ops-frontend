import React from "react";
import { Box, Heading, Text, SimpleGrid, VStack } from "@chakra-ui/react";
import CustomCard from "@/components/CustomCard";
import { PAYLOAD_OPTIONS } from "@/constants/constants";

const CATEGORIZED_HOOKS = {
  "Fee Configuration": ["hook-stable-surge", "hook-mev-capture"],
};

const HooksPage = () => {
  const getPayloadByKey = (key: string) => {
    return PAYLOAD_OPTIONS.find(payload => payload.key === key);
  };

  return (
    <Box p={4} maxW="container.xl" mx="auto">
      <Heading as="h2" size="lg" mb={2} variant="special">
        Hooks
      </Heading>
      <Text mb={4}>View and configure hooks for Balancer pools</Text>

      <VStack spacing={8} align="stretch">
        {Object.entries(CATEGORIZED_HOOKS).map(([category, hookKeys]) => (
          <Box key={category}>
            <Heading as="h3" size="md" mb={4} pb={2}>
              {category}
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {hookKeys.map(key => {
                const hook = getPayloadByKey(key);
                if (!hook) return null;

                return (
                  <CustomCard
                    key={hook.key}
                    title={hook.label}
                    description={hook.description}
                    button_label={hook.button_label}
                    icon={<hook.icon />}
                    link={hook.href}
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

export default HooksPage;
