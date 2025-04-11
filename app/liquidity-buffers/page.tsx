import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import LiquidityBuffersModule from "@/components/LiquidityBuffersModule";
import { Box } from "@chakra-ui/react";

export default async function LiquidityBufferPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Box minH="100vh" bg="gray.950" color="gray.100" p={6}>
      <Box maxW="7xl" mx="auto">
        <Suspense fallback={<Skeleton w="full" h="500px" />}>
          <LiquidityBuffersModule addressBook={addressBook} />
        </Suspense>
      </Box>
    </Box>
  );
}
