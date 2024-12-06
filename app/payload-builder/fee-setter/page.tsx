import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import ChangeSwapFeeModule from "@/components/ChangeSwapFeeModule";

export default async function FeeSetterPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <ChangeSwapFeeModule addressBook={addressBook} />
    </Suspense>
  );
}
