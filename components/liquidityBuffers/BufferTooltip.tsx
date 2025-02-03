import { Box, Text, HStack, Badge, VStack, useColorModeValue } from "@chakra-ui/react";
import { PoolToken } from "@/types/interfaces";

interface BufferTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: {
      token: PoolToken;
      underlying: number;
      wrapped: number;
    };
  }>;
}

export const BufferTooltip = ({ active, payload }: BufferTooltipProps) => {
  const bgColor = useColorModeValue("white", "background.level2");

  if (!active || !payload?.length) return null;

  const { token, underlying, wrapped } = payload[0].payload;
  const total = underlying + wrapped;
  const ratios = {
    underlying: ((underlying / total) * 100).toFixed(1),
    wrapped: ((wrapped / total) * 100).toFixed(1),
  };

  return (
    <Box
      bg={bgColor}
      p={3}
      borderRadius="md"
      border="1px solid"
      borderColor="transparent"
      boxShadow="lg"
      minW="300px"
    >
      <HStack mb={2} spacing={2}>
        <Text fontWeight="semibold">{token.name}</Text>
        <Badge bg="whiteAlpha.200" textTransform="none">
          {token.symbol}
        </Badge>
      </HStack>
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between" minW="200px">
          <Text color="gray.400">Underlying:</Text>
          <Text color="#627EEA" fontWeight="medium">
            {underlying.toFixed(2)} ({ratios.underlying}%)
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text color="gray.400">Wrapped:</Text>
          <Text color="#E5E5E5" fontWeight="medium">
            {wrapped.toFixed(2)} ({ratios.wrapped}%)
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
};
