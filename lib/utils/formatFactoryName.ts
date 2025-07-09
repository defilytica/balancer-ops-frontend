/**
 * Format factory name for display in UI by converting camelCase to human-readable format
 * Examples:
 * - "WeightedPoolFactory" -> "Weighted Pool Factory"
 * - "Gyro2CLPPoolFactory" -> "Gyro 2 CLP Pool Factory"
 * - "ReClammPoolFactory" -> "ReCLAMM Pool Factory"
 */
export function formatFactoryName(factoryName: string): string {
  // Remove "Factory" suffix if present
  let displayName = factoryName.replace(/Factory$/, "");

  // Special case for ReCLAMM - keep it as ReCLAMM
  if (displayName.includes("ReClamm")) {
    displayName = displayName.replace("ReClamm", "ReCLAMM");
  }

  // Generic handling: add spaces before capital letters and handle "Pool" suffix
  displayName = displayName
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // Handle consecutive capitals like "CLPPool" -> "CLP Pool"
    .replace(/Pool$/, " Pool") // Ensure "Pool" is separated
    .replace(/\s+/g, " ") // Clean up multiple spaces
    .trim();

  return `${displayName} Factory`;
}

/**
 * Extract version info from deployment ID
 */
export function getVersionFromDeployment(deployment: string): string {
  if (deployment.includes("-v2")) return " (v2)";
  if (deployment.includes("-v3")) return " (v3)";
  return "";
}
