import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import MevCaptureHookConfigurationModule from "@/components/MevCaptureHookConfigurationModule";

export default async function MevCapturePage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <MevCaptureHookConfigurationModule addressBook={addressBook} />
    </Suspense>
  );
}
