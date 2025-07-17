import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import EmergencyPayloadBuilder from "@/components/EmergencyPayloadBuilder";

export default async function EmergencyPayloadBuilderPage() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <EmergencyPayloadBuilder addressBook={addressBook} />
    </Suspense>
  );
}
