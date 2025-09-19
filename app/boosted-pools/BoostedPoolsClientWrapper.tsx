"use client";

import BoostedPoolsModule from "@/components/BoostedPoolsModule";
import { Box } from "@chakra-ui/react";
import { AddressBook } from "@/types/interfaces";

interface BoostedPoolsClientWrapperProps {
  addressBook: AddressBook;
}

export default function BoostedPoolsClientWrapper({ addressBook }: BoostedPoolsClientWrapperProps) {
  return (
    <Box minH="100vh" bg="gray.950" color="gray.100" p={6}>
      <Box maxW="7xl" mx="auto">
        <BoostedPoolsModule addressBook={addressBook} />
      </Box>
    </Box>
  );
}
