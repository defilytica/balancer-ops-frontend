"use client";

import LiquidityBuffersModule from "@/components/LiquidityBuffersModule";
import { Box, Skeleton } from "@chakra-ui/react";
import { AddressBook } from "@/types/interfaces";

interface LiquidityBuffersClientWrapperProps {
  addressBook: AddressBook;
}

export default function LiquidityBuffersClientWrapper({
  addressBook,
}: LiquidityBuffersClientWrapperProps) {
  return (
    <Box minH="100vh" bg="gray.950" color="gray.100" p={6}>
      <Box maxW="7xl" mx="auto">
        <LiquidityBuffersModule addressBook={addressBook} />
      </Box>
    </Box>
  );
}
