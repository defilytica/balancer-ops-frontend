import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import SdbalVestingManager from "@/components/SdbalVestingManager";

export default async function SdbalVestingPage() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <SdbalVestingManager addressBook={addressBook} />
    </Suspense>
  );
}
