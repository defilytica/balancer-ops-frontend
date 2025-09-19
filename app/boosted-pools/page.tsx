import { Suspense } from "react";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import BoostedPoolsClientWrapper from "./BoostedPoolsClientWrapper";

export default async function BoostedPoolsPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense
      fallback={
        <div style={{ width: "100%", height: "500px", backgroundColor: "#1a202c" }}>Loading...</div>
      }
    >
      <BoostedPoolsClientWrapper addressBook={addressBook} />
    </Suspense>
  );
}
