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
  Button,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import { Pool, AddressBook } from "@/types/interfaces";
import { networks, NETWORK_OPTIONS } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { Globe, Settings } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { useFormattedHookAttributes } from "@/lib/data/useFormattedHookAttributes";
import { formatHookAttributes } from "@/lib/data/useFormattedHookAttributes";
import { isStableSurgeHookParams } from "@/components/StableSurgeHookConfigurationModule";
import { isMevTaxHookParams } from "@/components/MevCaptureHookConfigurationModule";
import { useCallback, useMemo } from "react";
import Link from "next/link";
import { isZeroAddress } from "@ethereumjs/util";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import { HookType } from "@/components/HookParametersDashboardModule";

interface HookTableProps {
  pools: Pool[];
  selectedHookType?: HookType;
  addressBook: AddressBook;
}

export const HookParametersTable = ({
  pools,
  selectedHookType = "STABLE_SURGE",
  addressBook,
}: HookTableProps) => {
  const configButtonColor = useColorModeValue("gray.500", "gray.400");
  const configButtonHoverColor = useColorModeValue("gray.600", "gray.300");

  const getConfigRoute = useCallback(
    (pool: Pool) => {
      const network = pool.chain.toLowerCase();
      const route =
        selectedHookType === "STABLE_SURGE" ? "/hooks/stable-surge" : "/hooks/mev-capture";
      return `${route}?network=${network}&pool=${pool.address}`;
    },
    [selectedHookType],
  );

  const getOwnerType = useCallback(
    (pool: Pool) => {
      const network = pool.chain.toLowerCase();

      // Early return for zero address
      if (isZeroAddress(pool.swapFeeManager)) {
        return "DAO";
      }

      // For SONIC, use predefined constant
      if (network === "sonic") {
        const sonic = NETWORK_OPTIONS.find(el => el.apiID === "SONIC");
        if (sonic?.maxiSafe && pool.swapFeeManager.toLowerCase() === sonic.maxiSafe.toLowerCase()) {
          return "DAO";
        }
        return "EOA";
      }

      // For other networks, check addressBook
      const multisigs = getCategoryData(addressBook, network, "multisigs");
      const multisigAddress = multisigs?.["maxi_omni"];
      const multisigValue =
        typeof multisigAddress === "string"
          ? multisigAddress
          : multisigAddress?.[Object.keys(multisigAddress)[0]];

      return multisigValue && pool.swapFeeManager.toLowerCase() === multisigValue.toLowerCase()
        ? "DAO"
        : "EOA";
    },
    [addressBook],
  );

  // Filter pools based on selected hook type
  const filteredPools = useMemo(() => {
    return pools.filter(pool => {
      if (selectedHookType === "STABLE_SURGE") {
        return isStableSurgeHookParams(pool.hook?.params);
      } else if (selectedHookType === "MEV_TAX") {
        return isMevTaxHookParams(pool.hook?.params);
      }
      return false;
    });
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
            <Th>Owner</Th>
            <Th>Configure</Th>
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
                <Td>
                  <Badge
                    colorScheme="purple"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={1}
                    py={1}
                  >
                    {getOwnerType(pool)}
                  </Badge>
                </Td>
                <Td>
                  <Link href={getConfigRoute(pool)}>
                    <Button
                      size="sm"
                      leftIcon={<Icon as={Settings} boxSize="4" />}
                      variant="outline"
                      borderColor={configButtonColor}
                      color={configButtonColor}
                      _hover={{
                        color: configButtonHoverColor,
                        borderColor: configButtonHoverColor,
                      }}
                    >
                      Configure
                    </Button>
                  </Link>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
