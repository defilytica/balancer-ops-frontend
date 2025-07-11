/**
 * Generates a unique ID based on date and time (minute precision)
 * Used for general purposes like branch names, file names, etc.
 * Format: YYYY-MM-DD_HHMM
 */
export const generateUniqueId = () => {
  const now = new Date();

  // Extract date components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Extract time components
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  // Format as YYYY-MM-DD_HHMM
  return `${year}-${month}-${day}_${hours}${minutes}`;
};

/**
 * Generates a unique operation ID with millisecond precision and random suffix
 * Used specifically for payload composer operations to ensure absolute uniqueness
 * Format: YYYY-MM-DD_HHMMSS_MMM_RANDOM
 */
export const generateUniqueOperationId = () => {
  const now = new Date();

  // Extract date components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Extract time components
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  // Generate a random suffix for absolute uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  // Format as YYYY-MM-DD_HHMMSS_MMM_RANDOM for guaranteed uniqueness
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}_${milliseconds}_${randomSuffix}`;
};
