import { FormattedDeployment } from "@/types/interfaces";

/**
 * Formats a deployment string to be more readable
 * e.g., "20231004-mainnet-protocol-fee-controller" -> "Protocol Fee Controller (2023-10-04)"
 * or "20250307-v3-liquidity-bootstrapping-pool" -> "Liquidity Bootstrapping Pool (2025-03-07)"
 */
export const formatDeploymentName = (deployment: string): FormattedDeployment => {
  try {
    // Extract date from the beginning (8 digits)
    const dateMatch = deployment.match(/^(\d{8})/);
    let formattedDate = "";

    if (dateMatch) {
      const dateStr = dateMatch[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      formattedDate = `${year}-${month}-${day}`;
    }

    // Check if it's a v3 deployment
    const isV3 = deployment.includes("-v3-");
    const version = isV3 ? "v3" : "v2";

    // Extract the readable name part
    let name = "";
    if (isV3) {
      // For v3: format is YYYYMMDD-v3-name
      const nameMatch = deployment.match(/^\d{8}-v3-(.+)$/);
      if (nameMatch) {
        name = nameMatch[1];
      }
    } else {
      // For v2: format is YYYYMMDD-name
      const nameMatch = deployment.match(/^\d{8}-(.+)$/);
      if (nameMatch) {
        name = nameMatch[1];
      }
    }

    // Format the name with spaces and proper capitalization
    const formattedName = name
      .split("-")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      name: formattedName,
      date: formattedDate,
      version,
    };
  } catch (e) {
    return { name: deployment, date: "", version: "v2" }; // Default to v2 if parsing fails
  }
};
