import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import StableSurgeConfigurationModule from "@/components/StableSurgeConfigurationModule";

export default async function StableSurgePage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <StableSurgeConfigurationModule addressBook={addressBook} />
    </Suspense>
  );
}
