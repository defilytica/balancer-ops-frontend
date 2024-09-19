import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/skeleton";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import RewardsInjector from "@/components/RewardsInjector";

export default async function RewardsInjectorPage({
                                                      params,
                                                  }: {
    params: { address?: string[] };
}) {
    const addressBook = await fetchAddressBook();
    const injectorAddress = params.address?.[0] || null;
    console.log("injectorAddress:", injectorAddress)

    return (
        <Suspense fallback={<Skeleton w="full" h="500px" />}>
            <RewardsInjector
                addressBook={addressBook}
                initialAddress={injectorAddress}
            />
        </Suspense>
    );
}
