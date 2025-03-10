import {
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Box,
  Stack,
  Divider,
  VStack,
  HStack,
  Spinner,
  Icon,
  Avatar,
} from "@chakra-ui/react";
import { PoolWithBufferBalances } from "@/lib/hooks/useBufferBalances";
import { formatUnits } from "viem";
import { calculateRatios } from "@/lib/utils/calculateRatios";
import { formatValue } from "@/lib/utils/formatValue";
import { BiErrorCircle } from "react-icons/bi";
import { useMemo } from "react";

interface BufferTableTooltipProps {
  pool: PoolWithBufferBalances;
  erc4626Count: number;
}

export const BufferTableTooltip = ({ pool, erc4626Count }: BufferTableTooltipProps) => {
  const erc4626Tokens = useMemo(
    () => pool.poolTokens.filter(token => token.isErc4626),
    [pool.poolTokens],
  );

  const isLoading = erc4626Tokens.some(token => pool.buffers?.[token.address]?.state?.isLoading);
  const hasError = erc4626Tokens.some(token => pool.buffers?.[token.address]?.state?.isError);

  const nonEmptyBufferCount = Object.values(pool.buffers || {}).filter(buffer => {
    if (buffer.state?.isError) return true;
    return buffer.underlyingBalance > BigInt(0) || buffer.wrappedBalance > BigInt(0);
  }).length;

  const formatBufferValue = (value: bigint, decimals: number) => {
    const formattedValue = Number(formatUnits(value, decimals));
    return value > 0 && formattedValue < 0.01 ? "< 0.01" : formatValue(value, decimals);
  };

  const renderContent = () => {
    return (
      <Box p={4}>
        <Stack spacing={4} divider={<Divider />}>
          {erc4626Tokens.map(token => {
            const buffer = pool.buffers?.[token.address];
            if (!buffer) return null;

            const ratios = calculateRatios(
              buffer.underlyingBalance,
              buffer.wrappedBalance,
              token.decimals!,
            );

            return (
              <Box key={token.address}>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Avatar src={token.logoURI} boxSize="24px" />
                      <Text fontWeight="medium">{token.symbol}</Text>
                    </HStack>
                    {buffer.state?.isError ? (
                      <HStack color="red.400">
                        <Icon as={BiErrorCircle} />
                        <Text fontSize="sm">Failed to load</Text>
                      </HStack>
                    ) : (
                      ratios && (
                        <Text color="gray.400">
                          {ratios.underlying}% - {ratios.wrapped}%
                        </Text>
                      )
                    )}
                  </HStack>

                  <Stack spacing={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.400">
                        Underlying
                      </Text>
                      {buffer.state?.isError ? (
                        <Text fontSize="sm" color="red.400">
                          Error
                        </Text>
                      ) : (
                        <Text fontSize="sm">
                          {formatBufferValue(buffer.underlyingBalance, token.decimals!)}{" "}
                          {token.underlyingToken?.symbol}
                        </Text>
                      )}
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.400">
                        Wrapped
                      </Text>
                      {buffer.state?.isError ? (
                        <Text fontSize="sm" color="red.400">
                          Error
                        </Text>
                      ) : (
                        <Text fontSize="sm">
                          {formatBufferValue(buffer.wrappedBalance, token.decimals!)} {token.symbol}
                        </Text>
                      )}
                    </HStack>
                  </Stack>
                </VStack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  };

  return (
    <>
      {isLoading ? (
        <Spinner size="xs" />
      ) : (
        <Popover trigger="hover" placement="bottom">
          <PopoverTrigger>
            {hasError ? (
              <Box>
                <Icon
                  color="red.400"
                  _hover={{ color: "font.highlight", cursor: "pointer" }}
                  as={BiErrorCircle}
                  boxSize="5"
                />
              </Box>
            ) : (
              <Text
                display="inline-block"
                color={nonEmptyBufferCount < erc4626Count ? "red.400" : "font.primary"}
                _hover={{ color: "font.highlight", cursor: "pointer" }}
              >
                {nonEmptyBufferCount}/{erc4626Count}
              </Text>
            )}
          </PopoverTrigger>
          <PopoverContent
            borderColor="whiteAlpha.200"
            p={0}
            minW="350px"
            _focus={{ outline: "none" }}
          >
            {renderContent()}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
