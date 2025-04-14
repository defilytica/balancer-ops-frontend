import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import HookParametersDashboardModule from "@/components/HookParametersDashboardModule";

export default async function HookDashboardPage() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <HookParametersDashboardModule addressBook={addressBook} />
    </Suspense>
  );
}
