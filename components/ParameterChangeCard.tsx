"use client";

import { Box, Card, CardBody, CardHeader, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";
import { ReactNode } from "react";

interface ParameterChange {
  name: string;
  currentValue: number;
  newValue: number;
  unit?: string;
  precision?: number;
}

interface ParameterChangeCardProps {
  title: string;
  icon?: ReactNode;
  parameters: ParameterChange[];
}

export function ParameterChangeCard({ title, icon, parameters }: ParameterChangeCardProps) {
  return (
    <Card>
      <CardHeader>
        <Flex alignItems="center">
          {icon && <Box mr={2}>{icon}</Box>}
          <Heading size="md">{title}</Heading>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex direction="column">
          {parameters.map((param, index) => {
            const change = param.newValue - param.currentValue;
            const precision = param.precision ?? 2;
            const unit = param.unit ?? "%";

            return (
              <Box key={param.name}>
                {index > 0 && <Divider my={4} />}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  gap={4}
                  width="100%"
                  justify="center"
                >
                  <Card variant="outline" p={3} flex="1">
                    <Flex direction="column" justify="center" align="center" h="full">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Current {param.name}
                      </Text>
                      <Heading size="lg">
                        {param.currentValue.toFixed(precision)}
                        {unit}
                      </Heading>
                    </Flex>
                  </Card>

                  <Card variant="outline" p={3} flex="1">
                    <Flex direction="column" justify="center" align="center" h="full">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        New {param.name}
                      </Text>
                      <Heading size="lg">
                        {param.newValue.toFixed(precision)}
                        {unit}
                      </Heading>
                    </Flex>
                  </Card>

                  <Card variant="outline" p={3} flex="1">
                    <Flex direction="column" justify="center" align="center" h="full">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Change
                      </Text>
                      <Flex align="center">
                        <Heading size="lg">
                          {change > 0 ? "+" : ""}
                          {change.toFixed(precision)}
                          {unit}
                        </Heading>
                        {change !== 0 && (
                          <Box ml={2}>
                            {change > 0 ? (
                              <TriangleUpIcon boxSize={6} color="green.500" />
                            ) : (
                              <TriangleDownIcon boxSize={6} color="red.500" />
                            )}
                          </Box>
                        )}
                      </Flex>
                    </Flex>
                  </Card>
                </Flex>
              </Box>
            );
          })}
        </Flex>
      </CardBody>
    </Card>
  );
}
