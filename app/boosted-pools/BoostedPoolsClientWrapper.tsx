"use client";

import BoostedPoolsModule from "@/components/BoostedPoolsModule";
import { Box } from "@chakra-ui/react";
import { AddressBook } from "@/types/interfaces";
import { BufferBlocklist } from "@/lib/services/fetchBufferBlocklist";

interface BoostedPoolsClientWrapperProps {
  addressBook: AddressBook;
  bufferBlocklist: BufferBlocklist;
}

export default function BoostedPoolsClientWrapper({
  addressBook,
  bufferBlocklist,
}: BoostedPoolsClientWrapperProps) {
  return (
    <Box minH="100vh" bg="gray.950" color="gray.100" p={6}>
      <Box maxW="7xl" mx="auto">
        <BoostedPoolsModule addressBook={addressBook} bufferBlocklist={bufferBlocklist} />
      </Box>
    </Box>
  );
}
