import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import ChangeProtocolFeeV3Module from "@/components/ChangeProtocolFeeV3Module";

export default async function ProtocolFeeSetterPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <ChangeProtocolFeeV3Module addressBook={addressBook} />
    </Suspense>
  );
}
