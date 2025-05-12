/**
 * Formats a deployment function name for better readability
 */
export const formatFunctionName = (description: string): string => {
  // Extract function name after the dot
  const parts = description.split(".");
  if (parts.length > 1) {
    // Convert camelCase to spaces with proper formatting
    return parts[1].replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  }
  return description;
};
