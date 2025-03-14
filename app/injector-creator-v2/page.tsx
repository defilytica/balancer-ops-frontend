import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import InjectorCreatorModule from "@/components/InjectorCreatorModule";

export default async function InjectorCreatorPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <InjectorCreatorModule addressBook={addressBook} />
    </Suspense>
  );
}
