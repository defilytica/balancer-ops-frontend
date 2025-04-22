import { AddressBook } from "@/types/interfaces";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import { NETWORK_OPTIONS } from "@/constants/constants";

export const getMultisigForNetwork = (
  addressBook: AddressBook,
  network: string,
  multisigType: "maxi_omni" | "lm" = "maxi_omni",
): string => {
  // For SONIC, we fetch predefined constants
  if (network.toLowerCase() === "sonic") {
    const sonic = NETWORK_OPTIONS.find(el => el.apiID === "SONIC");
    return sonic ? sonic?.maxiSafe : "";
  }

  const multisigs = getCategoryData(addressBook, network.toLowerCase(), "multisigs");
  if (multisigs && multisigs[multisigType]) {
    const lm = multisigs[multisigType];
    if (typeof lm === "string") {
      return lm;
    } else if (typeof lm === "object") {
      return Object.values(lm)[0];
    }
  }
  return "";
};
