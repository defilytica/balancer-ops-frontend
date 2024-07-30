import CreatePayment from "@/lib/modules/payloadBuilders/CreatePayment";
import {fetchAddressBook} from "@/lib/shared/data/maxis/addressBook";
import {Suspense} from "react";
import {Skeleton} from "@chakra-ui/skeleton";

export default async function CreatePaymentPage() {

    //Fetch address book data
    const addressBook = await fetchAddressBook();

    return (
        <Suspense fallback={<Skeleton w="full" h="500px"/>}>
            <CreatePayment addressBook={addressBook}/>
        </Suspense>
    );
}
