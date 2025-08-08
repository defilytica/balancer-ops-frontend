import { Suspense } from "react";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import LiquidityBuffersClientWrapper from "./LiquidityBuffersClientWrapper";

export default async function LiquidityBufferPage() {
  //Fetch address book data
  const addressBook = await fetchAddressBook();

  return (
    <Suspense
      fallback={
        <div style={{ width: "100%", height: "500px", backgroundColor: "#1a202c" }}>Loading...</div>
      }
    >
      <LiquidityBuffersClientWrapper addressBook={addressBook} />
    </Suspense>
  );
}
