import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import ChangeSwapFeeV3Module from "@/components/ChangeSwapFeeV3Module";
import { ethers } from "ethers";

export default async function FeeSetterPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense fallback={<Skeleton w="full" h="500px" />}>
      <ChangeSwapFeeV3Module addressBook={addressBook} />
    </Suspense>
  );
}
