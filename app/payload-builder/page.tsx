import { Box, Heading, Text, SimpleGrid } from "@chakra-ui/react";
import { PAYLOAD_OPTIONS } from "@/constants/constants";
import React from "react";
import CustomCard from "@/components/CustomCard";

export default function PayloadBuilder() {
  return (
    <Box p={2} maxW="container.lg" mx="auto">
      <Heading as="h2" size="lg" variant="special">
        Payload Builder Library
      </Heading>
      <Text mb={4}>Choose from a variety of options to create Balancer DAO Payloads</Text>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {PAYLOAD_OPTIONS.map(link => (
          <CustomCard
            key={link.key}
            title={link.label}
            description={link.description}
            button_label={link.button_label}
            icon={<link.icon />}
            link={link.href}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
