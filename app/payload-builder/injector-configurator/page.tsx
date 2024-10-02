import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import RewardsInjectorContainer from "@/components/RewardsInjectorContainer";

export default async function InjectorConfigurator() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <RewardsInjectorContainer addressBook={addressBook} isViewer={false} />
    </Suspense>
  );
}
