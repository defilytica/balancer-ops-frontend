import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import ManageBufferModule from "@/components/ManageBufferModule";

export default async function ManageBufferPage() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <ManageBufferModule addressBook={addressBook} />
    </Suspense>
  );
}
