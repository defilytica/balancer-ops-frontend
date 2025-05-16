import {
  Box,
  Text,
  HStack,
  Image,
  Icon,
  Avatar,
  Tooltip,
  Grid,
  GridItem,
  VStack,
  Card,
} from "@chakra-ui/react";
import { PoolWithBufferData } from "@/lib/hooks/useBufferData";
import { networks } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { BufferTableTooltip } from "../liquidityBuffers/BufferTableTooltip";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { filterRealErc4626Tokens } from "@/lib/utils/tokenFilters";
import { PaginatedTable } from "../../lib/shared/components/PaginatedTable";

interface BufferTableProps {
  pools: PoolWithBufferData[];
  pageSize: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const BufferTableHeader = () => (
  <Grid
    templateColumns={{ base: "40px 3fr 1.2fr 1.2fr 0.8fr", md: "40px 3fr 1.2fr 1.2fr 0.8fr" }}
    gap={{ base: "xxs", xl: "lg" }}
    px={{ base: 4, md: 8 }}
    py={{ base: 3, md: 4 }}
    w="full"
    alignItems="center"
    bg="background.level2"
    borderTopRadius="xl"
    borderBottomWidth="0px"
    borderColor="background.level3"
  >
    <GridItem>
      <VStack align="start" w="full">
        <Icon as={Globe} boxSize="5" color="font.primary" />
      </VStack>
    </GridItem>
    <GridItem>Pool name</GridItem>
    <GridItem justifySelf="end">
      <Text fontWeight="bold">TVL</Text>
    </GridItem>
    <GridItem justifySelf="end">
      <Text fontWeight="bold"># of ERC4626</Text>
    </GridItem>
    <GridItem justifySelf="end">
      <Text fontWeight="bold">Buffers</Text>
    </GridItem>
  </Grid>
);

const BufferTableRow = ({
  item: pool,
  index,
  itemsLength,
}: {
  item: PoolWithBufferData;
  index: number;
  itemsLength: number;
}) => {
  const realErc4626Count = filterRealErc4626Tokens(pool.poolTokens).length;

  const isLast = index === itemsLength - 1;
  return (
    <Box
      w="full"
      gap={{ base: "xxs", xl: "lg" }}
      px={{ base: 4, md: 8 }}
      py={{ base: 4, md: 5 }}
      borderBottomRadius={isLast ? "xl" : "none"}
      bg="background.level2"
      _hover={{ bg: "background.level1" }}
      transition="background 0.2s"
      boxShadow="none"
    >
      <Grid
        templateColumns={{ base: "40px 3fr 1.2fr 1.2fr 0.8fr", md: "40px 3fr 1.2fr 1.2fr 0.8fr" }}
        gap={{ base: 4, md: 6 }}
        alignItems="center"
        w="full"
      >
        {/* Network */}
        <GridItem>
          <Image
            src={networks[pool.chain.toLowerCase()].logo}
            alt={pool.chain.toLowerCase()}
            boxSize="5"
          />
        </GridItem>
        {/* Pool name and tokens */}
        <GridItem>
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
            <Text ml={2}>{pool.name || pool.symbol}</Text>
          </HStack>
        </GridItem>
        {/* TVL */}
        <GridItem justifySelf="end">
          <Text fontWeight="medium">
            {shortCurrencyFormat(Number(pool.dynamicData?.totalLiquidity || "0"))}
          </Text>
        </GridItem>
        {/* # of ERC4626 */}
        <GridItem justifySelf="end">
          <Text fontWeight="medium">{realErc4626Count}</Text>
        </GridItem>
        {/* Buffers */}
        <GridItem justifySelf="end">
          <BufferTableTooltip pool={pool} />
        </GridItem>
      </Grid>
    </Box>
  );
};

export const BufferTable = ({
  pools,
  pageSize,
  currentPage,
  totalPages,
  loading,
  onPageChange,
  onPageSizeChange,
}: BufferTableProps) => {
  const showPagination = totalPages > 1;

  return (
    <Card
      alignItems="flex-start"
      left={{ base: "-4px", sm: "0" }}
      p={{ base: "0", sm: "0" }}
      position="relative"
      // fixing right padding for horizontal scroll on mobile
      pr={{ base: "lg", sm: "lg", md: "lg", lg: "0" }}
      w={{ base: "100vw", lg: "full" }}
    >
      <PaginatedTable
        items={pools}
        loading={loading}
        renderTableHeader={BufferTableHeader}
        renderTableRow={({ item, index }) => (
          <BufferTableRow item={item} index={index} itemsLength={pools.length} />
        )}
        showPagination={showPagination}
        paginationProps={{
          goToFirstPage: () => onPageChange(1),
          goToLastPage: () => onPageChange(totalPages),
          goToNextPage: () => onPageChange(currentPage + 1),
          goToPreviousPage: () => onPageChange(currentPage - 1),
          canPreviousPage: currentPage > 1,
          canNextPage: currentPage < totalPages,
          currentPageNumber: currentPage,
          totalPageCount: totalPages,
          setPageSize: onPageSizeChange,
          pageSize,
        }}
        noItemsFoundLabel="No pools found"
        getRowId={pool => pool.address}
      />
    </Card>
  );
};
