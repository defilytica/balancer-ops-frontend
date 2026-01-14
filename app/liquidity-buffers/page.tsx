import React from "react";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import LiquidityBuffersModule from "@/components/LiquidityBuffersModule";
import { fetchBufferBlocklist } from "@/lib/services/fetchBufferBlocklist";

export default async function LiquidityBuffersPage() {
  const [addressBook, bufferBlocklist] = await Promise.all([
    fetchAddressBook(),
    fetchBufferBlocklist(),
  ]);

  return (
    <LiquidityBuffersModule addressBook={addressBook} bufferBlocklist={bufferBlocklist} />
  );
}
