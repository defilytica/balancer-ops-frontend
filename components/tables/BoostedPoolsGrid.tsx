import { useEffect, useState } from "react";
import {
  Box,
  Center,
  Divider,
  Text,
  Spinner,
  VStack,
  Skeleton,
  SimpleGrid,
  StyleProps,
  SimpleGridProps,
  GridItem,
} from "@chakra-ui/react";
import { Pagination } from "../../lib/shared/components/Pagination";
import { PoolWithBufferData } from "@/lib/hooks/usePoolBufferData";
import { PoolCard } from "../boostedPools/PoolCard";

interface BoostedPoolsGridProps extends SimpleGridProps {
  items: PoolWithBufferData[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
  noItemsFoundLabel?: string;
  loadingLength?: number;
  paginationStyles?: StyleProps;
}

export function BoostedPoolsGrid({
  items,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSize,
  noItemsFoundLabel = "No items found",
  loadingLength = 6,
  paginationStyles,
  ...simpleGridProps
}: BoostedPoolsGridProps) {
  const [previousPageCount, setPreviousPageCount] = useState(0);

  useEffect(() => {
    if (totalPages !== previousPageCount) {
      setPreviousPageCount(totalPages);
      if (currentPage > totalPages) {
        onPageChange(1);
      }
    }
  }, [totalPages, previousPageCount, currentPage, onPageChange]);

  const showPagination = totalPages > 1;

  return (
    <>
      <VStack w="full" align="stretch" spacing={0}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} w="full" {...simpleGridProps}>
          {items.length > 0 &&
            items.map(item => (
              <GridItem key={item.id} rowSpan={item.poolTokens.length + 1}>
                <PoolCard pool={item} />
              </GridItem>
            ))}
          {loading &&
            items.length === 0 &&
            Array.from({ length: loadingLength }).map((_, index) => (
              <Skeleton key={`grid-skeleton-${index}`} height="220px" borderRadius="xl" />
            ))}
        </SimpleGrid>
        {!loading && items.length === 0 && (
          <Center py="2xl">
            <Text color="font.secondary">{noItemsFoundLabel}</Text>
          </Center>
        )}
        {loading && items.length > 0 && (
          <Box
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              borderRadius: 10,
              zIndex: 10,
              backdropFilter: "blur(3px)",
            }}
          >
            <Center py="4xl">
              <Spinner size="xl" />
            </Center>
          </Box>
        )}
      </VStack>
      {showPagination && (
        <>
          <Divider />
          <Pagination
            p="md"
            goToFirstPage={() => onPageChange(1)}
            goToLastPage={() => onPageChange(totalPages)}
            goToNextPage={() => onPageChange(currentPage + 1)}
            goToPreviousPage={() => onPageChange(currentPage - 1)}
            canPreviousPage={currentPage > 1}
            canNextPage={currentPage < totalPages}
            currentPageNumber={currentPage}
            totalPageCount={totalPages}
            setPageSize={onPageSizeChange}
            pageSize={pageSize}
            {...paginationStyles}
          />
        </>
      )}
    </>
  );
}
