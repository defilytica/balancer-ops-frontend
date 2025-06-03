import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import ChangeAmpFactorModuleV2 from "@/components/ChangeAmpFactorModuleV2";

export default async function FeeSetterPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <ChangeAmpFactorModuleV2 addressBook={addressBook} />
    </Suspense>
  );
}
