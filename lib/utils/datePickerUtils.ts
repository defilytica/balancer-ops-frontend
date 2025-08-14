/**
 * Utility functions for handling datetime picker conversions between timestamps and local datetime strings
 */

/**
 * Converts a Unix timestamp string to a local datetime string for HTML datetime-local inputs
 * @param timestamp - Unix timestamp as string (seconds since epoch)
 * @returns Local datetime string in ISO format (YYYY-MM-DDTHH:mm) or empty string if invalid
 */
export const convertTimestampToLocalDateTime = (timestamp: string): string => {
  if (!timestamp || timestamp === "0") return "";
  const date = new Date(parseInt(timestamp) * 1000);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

/**
 * Gets the current datetime as a string suitable for datetime-local input min attribute
 * @returns Current local datetime string in ISO format (YYYY-MM-DDTHH:mm)
 */
export const getMinDateTime = (): string => {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localNow.toISOString().slice(0, 16);
};

/**
 * Converts a datetime-local input value to a Unix timestamp string
 * @param dateTimeString - Local datetime string from HTML datetime-local input
 * @returns Unix timestamp as string (seconds since epoch) or "0" if invalid
 */
export const convertDateTimeToTimestamp = (dateTimeString: string): string => {
  if (!dateTimeString) return "0";
  const timestamp = Math.floor(new Date(dateTimeString).getTime() / 1000);
  return timestamp.toString();
};