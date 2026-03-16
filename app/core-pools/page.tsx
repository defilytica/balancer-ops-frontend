import React from "react";
import CorePoolsDashboardModule from "@/components/CorePoolsDashboardModule";
import { fetchAddressBook } from "@/lib/data/balancer/addressBook";

export default async function CorePoolsPage() {
  const addressBook = await fetchAddressBook();

  return <CorePoolsDashboardModule addressBook={addressBook} />;
}
