import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import RewardsInjector from "@/components/RewardsInjector";

export default async function RewardsInjectorPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <RewardsInjector addressBook={addressBook} />
    </Suspense>
  );
}
