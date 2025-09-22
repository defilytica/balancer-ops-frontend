import React from "react";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import LiquidityBuffersModule from "@/components/LiquidityBuffersModule";

export default async function LiquidityBuffersPage() {
  const addressBook = await fetchAddressBook();

  return <LiquidityBuffersModule addressBook={addressBook} />;
}
