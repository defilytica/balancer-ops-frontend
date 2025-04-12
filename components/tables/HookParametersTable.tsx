import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Image,
  Icon,
  TableContainer,
  Avatar,
  Tooltip,
} from "@chakra-ui/react";
import { Pool } from "@/types/interfaces";
import { networks } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { useFormattedHookAttributes } from "@/lib/data/useFormattedHookAttributes";
import { formatHookAttributes } from "@/lib/data/useFormattedHookAttributes";
import { isStableSurgeHookParams } from "@/components/StableSurgeHookConfigurationModule";
import { isMevTaxHookParams } from "@/components/MevCaptureHookConfigurationModule";
import { useMemo } from "react";

type HookType = "STABLE_SURGE" | "MEV_TAX";

interface HookTableProps {
  pools: Pool[];
  selectedHookType?: HookType;
}

const isValidHookParams = (pool: Pool, hookType: HookType): boolean => {
  if (!pool.hook?.params || pool.hook.type !== hookType) return false;

  switch (hookType) {
    case "STABLE_SURGE":
      return isStableSurgeHookParams(pool.hook.params);
    case "MEV_TAX":
      return isMevTaxHookParams(pool.hook.params);
    default:
      return false;
  }
};

export const HookParametersTable = ({
  pools,
  selectedHookType = "STABLE_SURGE",
}: HookTableProps) => {
  // Filter pools based on selected hook type
  const filteredPools = useMemo(() => {
    return pools.filter(pool => isValidHookParams(pool, selectedHookType));
  }, [pools, selectedHookType]);

  // Get parameter names from the first pool with the selected hook type
  const parameterNames = useMemo(() => {
    if (filteredPools.length === 0) return [];
    const firstPool = filteredPools[0];
    const hookAttributes = formatHookAttributes(firstPool, false);
    return hookAttributes.map(attr => attr.title);
  }, [filteredPools]);

  return (
    <TableContainer
      w="full"
      borderColor="transparent"
      borderRadius="xl"
      borderWidth="1px"
      shadow="md"
      p={2}
    >
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>
              <Icon as={Globe} boxSize="5" />
            </Th>
            <Th>Pool name</Th>
            <Th isNumeric>TVL</Th>
            {parameterNames.map((paramName, index) => (
              <Th key={index} isNumeric>
                {paramName}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {filteredPools.map(pool => {
            const parameters = useFormattedHookAttributes(pool, false);

            return (
              <Tr key={pool.address} _hover={{ bg: "whiteAlpha.50" }}>
                <Td>
                  <HStack spacing={2}>
                    <Image
                      src={networks[pool.chain.toLowerCase()].logo}
                      alt={pool.chain.toLowerCase()}
                      boxSize="5"
                    />
                  </HStack>
                </Td>
                <Td>
                  <HStack>
                    {pool.poolTokens.map((token, index) => (
                      <Box
                        key={index}
                        ml={index === 0 ? 0 : "-15px"}
                        zIndex={pool.poolTokens.length - index}
                      >
                        <Tooltip
                          bgColor="background.level4"
                          label={token.symbol}
                          textColor="font.primary"
                          placement="bottom"
                        >
                          {token.logoURI ? (
                            <Avatar
                              src={token.logoURI}
                              size="xs"
                              borderWidth="1px"
                              borderColor="background.level1"
                            />
                          ) : (
                            <Box display="flex">
                              <Icon
                                as={FaCircle}
                                boxSize="5"
                                borderWidth="1px"
                                borderColor="background.level1"
                              />
                            </Box>
                          )}
                        </Tooltip>
                      </Box>
                    ))}
                    <Text>{pool.name || pool.symbol}</Text>
                  </HStack>
                </Td>
                <Td isNumeric>
                  <Text>
                    {shortCurrencyFormat(Number(pool.dynamicData?.totalLiquidity || "0"))}
                  </Text>
                </Td>
                {parameters.map((param, index) => (
                  <Td key={index} isNumeric>
                    <Text>{param.value}</Text>
                  </Td>
                ))}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
