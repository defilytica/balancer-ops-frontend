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
import { PoolWithBufferBalances } from "@/lib/hooks/useBufferBalances";
import { networks } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { BufferTableTooltip } from "../liquidityBuffers/BufferTableTooltip";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { filterRealErc4626Tokens } from "@/lib/utils/tokenFilters";

interface BufferTableProps {
  pools: PoolWithBufferBalances[];
}

export const BufferTable = ({ pools }: BufferTableProps) => {
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
            <Th isNumeric># of ERC4626</Th>
            <Th isNumeric>Buffers</Th>
          </Tr>
        </Thead>
        <Tbody>
          {pools.map(pool => {
            const realErc4626Count = filterRealErc4626Tokens(pool.poolTokens).length;
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
                <Td isNumeric>
                  <Text>{realErc4626Count}</Text>
                </Td>
                <Td isNumeric>
                  <BufferTableTooltip pool={pool} />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
