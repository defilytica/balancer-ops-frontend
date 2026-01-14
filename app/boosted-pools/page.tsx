import { Suspense } from "react";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import BoostedPoolsClientWrapper from "./BoostedPoolsClientWrapper";
import { fetchBufferBlocklist } from "@/lib/services/fetchBufferBlocklist";

export default async function BoostedPoolsPage() {
  const [addressBook, bufferBlocklist] = await Promise.all([
    fetchAddressBook(),
    fetchBufferBlocklist(),
  ]);

  return (
    <Suspense
      fallback={
        <div style={{ width: "100%", height: "500px", backgroundColor: "#1a202c" }}>Loading...</div>
      }
    >
      <BoostedPoolsClientWrapper addressBook={addressBook} bufferBlocklist={bufferBlocklist} />
    </Suspense>
  );
}
