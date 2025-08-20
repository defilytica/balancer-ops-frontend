"use client";

import React from "react";
import {
  Box,
  Card,
  Stack,
  HStack,
  Heading,
  VStack,
  Skeleton,
  SkeletonText,
  Flex,
} from "@chakra-ui/react";

export const ReClammPoolInfoCardSkeleton: React.FC = () => {
  return (
    <Card>
      <VStack alignItems="flex-start" spacing={{ base: "sm", md: "md" }} width="full" p={4}>
        <Flex width="full" justifyContent="space-between" alignItems="center">
          <Skeleton height="20px" width="150px" />
          <Skeleton height="24px" width="80px" borderRadius="md" />
        </Flex>

        <VStack width="full" spacing="sm">
          {/* Header row for desktop */}
          <HStack spacing={{ base: "0", md: "xl" }} width="full" display={{ base: "none", md: "flex" }}>
            <Box minWidth="160px">
              <Skeleton height="16px" width="60px" />
            </Box>
            <Skeleton height="16px" width="50px" />
          </HStack>

          {/* Skeleton rows for attributes */}
          {Array.from({ length: 8 }).map((_, index) => (
            <Stack
              width="full"
              spacing={{ base: "xxs", md: "xl" }}
              key={`skeleton-row-${index}`}
              direction={{ base: "column", md: "row" }}
            >
              <Box minWidth="160px">
                <Skeleton height="14px" width="120px" />
              </Box>
              <SkeletonText noOfLines={1} skeletonHeight="14px" width="100px" />
            </Stack>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
};