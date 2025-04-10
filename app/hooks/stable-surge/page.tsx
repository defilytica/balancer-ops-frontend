import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import StableSurgeHookConfigurationModule from "@/components/StableSurgeHookConfigurationModule";

export default async function StableSurgePage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <StableSurgeHookConfigurationModule addressBook={addressBook} />
    </Suspense>
  );
}
