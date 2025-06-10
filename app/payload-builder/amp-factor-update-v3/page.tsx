import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import ChangeAmpFactorModule from "@/components/ChangeAmpFactorModule";

export default async function AmpFactorUpdateV3Page() {
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <ChangeAmpFactorModule addressBook={addressBook} protocolVersion="v3" />
    </Suspense>
  );
}
