import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import RewardsInjectorContainer from "@/components/RewardsInjectorContainer";

export default async function RewardsInjectorPage({
  params,
}: {
  params: { address?: string[] };
}) {
  const addressBook = await fetchAddressBook();
  const injectorAddress = params.address?.[0] || null;

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <RewardsInjectorContainer addressBook={addressBook} />
    </Suspense>
  );
}
