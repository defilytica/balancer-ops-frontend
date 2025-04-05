import { Box, Card, CardBody, CardHeader, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";
import { ReactNode } from "react";

interface ParameterChangePreview {
  name: string;
  currentValue: string;
  newValue: string;
  difference: string;
  // Optional formatter function for custom display
  formatValue?: (value: string) => string;
}

interface ParameterChangePreviewCardProps {
  title: string;
  icon?: ReactNode;
  parameters: ParameterChangePreview[];
}

export function ParameterChangePreviewCard({
  title,
  icon,
  parameters,
}: ParameterChangePreviewCardProps) {
  // Default formatter for displaying values
  const defaultFormatValue = (value: string): string => {
    return value;
  };

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
            const formatValue = param.formatValue ?? defaultFormatValue;

            // Determine if there's a change by checking if difference is not empty
            const hasChange = param.difference !== "" && param.difference !== "0";

            // Determine if positive by parsing the numeric value
            const isPositive = hasChange && parseFloat(param.difference) > 0;

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
                      <Text
                        fontSize={{ base: "xl", lg: "2xl" }}
                        fontWeight="bold"
                        sx={{
                          wordBreak: "break-all",
                          overflowWrap: "break-word",
                          maxWidth: "100%",
                        }}
                      >
                        {formatValue(param.currentValue)}
                      </Text>
                    </Flex>
                  </Card>

                  <Card variant="outline" p={3} flex="1">
                    <Flex direction="column" justify="center" align="center" h="full">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        New {param.name}
                      </Text>
                      <Text
                        fontSize={{ base: "xl", lg: "2xl" }}
                        fontWeight="bold"
                        sx={{
                          wordBreak: "break-all",
                          overflowWrap: "break-word",
                          maxWidth: "100%",
                        }}
                      >
                        {formatValue(param.newValue)}
                      </Text>
                    </Flex>
                  </Card>

                  <Card variant="outline" p={3} flex="1">
                    <Flex direction="column" justify="center" align="center" h="full">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Change
                      </Text>
                      <Flex align="center" width="100%" justify="center" wrap="wrap">
                        <Text
                          fontSize={{ base: "xl", lg: "2xl" }}
                          fontWeight="bold"
                          sx={{
                            wordBreak: "break-all",
                            overflowWrap: "break-word",
                            maxWidth: "100%",
                          }}
                        >
                          {hasChange ? (
                            <>
                              {isPositive ? "+" : ""}
                              {formatValue(param.difference)}
                            </>
                          ) : (
                            <>{formatValue(param.difference)}</>
                          )}
                        </Text>
                        {hasChange && (
                          <Box ml={2} flexShrink={0}>
                            {isPositive ? (
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
