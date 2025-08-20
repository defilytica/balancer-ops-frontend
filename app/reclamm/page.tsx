import React from "react";
import ReClammPoolsDashboardModule from "@/components/ReClammPoolsDashboardModule";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";

export default async function ReClammPage() {
  const addressBook = await fetchAddressBook();

  return <ReClammPoolsDashboardModule addressBook={addressBook} />;
}
