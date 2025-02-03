import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import CreateGaugeModule from "@/components/CreateGaugeModule";

export default async function GaugeCreatorPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <CreateGaugeModule addressBook={addressBook} />
    </Suspense>
  );
}
