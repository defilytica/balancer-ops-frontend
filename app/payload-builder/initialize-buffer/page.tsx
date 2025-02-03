import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import InitializeBufferModule from "@/components/InitializeBufferModule";

export default async function InitializeBufferPage() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <InitializeBufferModule addressBook={addressBook} />
    </Suspense>
  );
}
