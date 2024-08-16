import CreatePayment from "@/components/CreatePayment";
import {Suspense} from "react";
import {Skeleton} from "@chakra-ui/skeleton";
import {fetchAddressBook} from "@/lib/data/maxis/addressBook";

export default async function CreatePaymentPage() {

    //Fetch address book data
    const addressBook = await fetchAddressBook();

    return (
        <Suspense fallback={<Skeleton w="full" h="500px"/>}>
            <CreatePayment addressBook={addressBook}/>
        </Suspense>
    );
}
