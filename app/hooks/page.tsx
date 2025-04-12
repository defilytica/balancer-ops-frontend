"use client";

import React from "react";
import { Box, Heading, Text, VStack, Icon, Button, Container, Flex } from "@chakra-ui/react";
import { PAYLOAD_OPTIONS } from "@/constants/constants";
import Link from "next/link";
import { FaChartLine, FaShieldAlt, FaCog } from "react-icons/fa";

const CATEGORIZED_HOOKS = {
  "Fee Configuration": ["hook-stable-surge", "hook-mev-capture"],
};

const HooksPage = () => {
  const getPayloadByKey = (key: string) => {
    return PAYLOAD_OPTIONS.find(payload => payload.key === key);
  };

  return (
    <Container maxW="container.xl" pt={{ base: 4, md: 8 }}>
      <VStack spacing={2} textAlign="center" mb={8}>
        <Heading as="h2" size="lg" mb={2} variant="special">
          Hooks
        </Heading>
        <Text mb={6}>View and configure hooks for Balancer pools</Text>
      </VStack>

      <VStack spacing={12} align="stretch">
        <Box>
          <VStack spacing={2} textAlign="center" mb={{ base: 6, md: 8 }}>
            <Heading as="h3" size="md" variant="specialSecondary">
              Hook Parameters Dashboards
            </Heading>
            <Text fontSize={{ base: "sm", md: "md" }} maxW="container.md" mx="auto" px={4}>
              View active hooks and their configuration across the protocol.
            </Text>
          </VStack>

          <Flex
            width="100%"
            justifyContent="center"
            flexWrap="wrap"
            px={{ base: 4, md: 0 }}
            sx={{
              gap: { base: "16px", md: "24px", lg: "32px" },
            }}
            alignItems="stretch"
          >
            {/* StableSurge Dashboard */}
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={{ base: 4, md: 6 }}
              _hover={{
                shadow: "xl",
                transform: "translateY(-3px)",
              }}
              display="flex"
              width={{ base: "100%", md: "calc(50% - 12px)", lg: "calc(33.33% - 22px)" }}
              maxWidth={{ base: "100%", md: "350px" }}
              transition="all 0.2s"
            >
              <VStack spacing={4} align="center" width="100%" height="100%" justify="space-between">
                <VStack spacing={4} align="center" flex="1">
                  <Icon as={FaChartLine} boxSize={8} color="blue.300" />
                  <Heading size={{ base: "sm", md: "md" }}>StableSurge Dashboard</Heading>
                  <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                    Show StableSurge hook configurations for all pools
                  </Text>
                </VStack>
                <Button
                  as={Link}
                  href="/hooks/dashboard?type=stable-surge"
                  variant="primary"
                  width="100%"
                  style={{ textDecoration: "none" }}
                  size={{ base: "md", md: "lg" }}
                  _hover={{
                    transform: "scale(1.03)",
                  }}
                >
                  View Dashboard
                </Button>
              </VStack>
            </Box>

            {/* MEV Tax Dashboard */}
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={{ base: 4, md: 6 }}
              _hover={{
                shadow: "xl",
                transform: "translateY(-3px)",
              }}
              display="flex"
              width={{ base: "100%", md: "calc(50% - 12px)", lg: "calc(33.33% - 22px)" }}
              maxWidth={{ base: "100%", md: "350px" }}
              transition="all 0.2s"
            >
              <VStack spacing={4} align="center" width="100%" height="100%" justify="space-between">
                <VStack spacing={4} align="center" flex="1">
                  <Icon as={FaShieldAlt} boxSize={8} color="green.300" />
                  <Heading size={{ base: "sm", md: "md" }}>MEV Capture Dashboard</Heading>
                  <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                    Show MEV Capture hook configuration for all pools
                  </Text>
                </VStack>
                <Button
                  as={Link}
                  href="/hooks/dashboard?type=mev-tax"
                  variant="primary"
                  width="100%"
                  style={{ textDecoration: "none" }}
                  size={{ base: "md", md: "lg" }}
                  _hover={{
                    transform: "scale(1.03)",
                  }}
                  transition="all 0.2s ease"
                >
                  View Dashboard
                </Button>
              </VStack>
            </Box>
          </Flex>
        </Box>

        {/* Configuration Section */}
        <Box>
          <VStack spacing={2} textAlign="center" mb={{ base: 6, md: 8 }}>
            <Heading as="h3" size="md" variant="specialSecondary">
              Hook Configuration
            </Heading>
            <Text fontSize={{ base: "sm", md: "md" }} maxW="container.md" mx="auto" px={4}>
              Configure hook parameters for Balancer v3 pools.
            </Text>
          </VStack>

          <Flex
            width="100%"
            justifyContent="center"
            flexWrap="wrap"
            px={{ base: 4, md: 0 }}
            sx={{
              gap: { base: "16px", md: "24px", lg: "32px" },
            }}
            alignItems="stretch"
          >
            {Object.entries(CATEGORIZED_HOOKS).map(([category, hookKeys]) =>
              hookKeys.map(key => {
                const hook = getPayloadByKey(key);
                if (!hook) return null;

                return (
                  <Box
                    key={hook.key}
                    borderWidth="1px"
                    borderRadius="lg"
                    p={{ base: 4, md: 6 }}
                    _hover={{
                      shadow: "xl",
                      transform: "translateY(-3px)",
                    }}
                    display="flex"
                    width={{ base: "100%", md: "calc(50% - 12px)", lg: "calc(33.33% - 22px)" }}
                    maxWidth={{ base: "100%", md: "350px" }}
                    transition="all 0.2s"
                  >
                    <VStack
                      spacing={4}
                      align="center"
                      width="100%"
                      height="100%"
                      justify="space-between"
                    >
                      <VStack spacing={4} align="center" flex="1">
                        <Icon as={FaCog} boxSize={8} />
                        <Heading size={{ base: "sm", md: "md" }}>
                          {key === "hook-stable-surge"
                            ? "Configure StableSurge"
                            : "Configure MEV Capture"}
                        </Heading>
                        <Text textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                          Configure {key === "hook-stable-surge" ? "StableSurge" : "MevCapture"}{" "}
                          hook on a pool deployed on Balancer v3
                        </Text>
                      </VStack>
                      <Button
                        as={Link}
                        href={hook.href}
                        variant="primary"
                        width="100%"
                        style={{ textDecoration: "none" }}
                        size={{ base: "md", md: "lg" }}
                        _hover={{
                          transform: "scale(1.03)",
                        }}
                        transition="all 0.2s ease"
                      >
                        Configure
                      </Button>
                    </VStack>
                  </Box>
                );
              }),
            )}
          </Flex>
        </Box>
      </VStack>
    </Container>
  );
};

export default HooksPage;
