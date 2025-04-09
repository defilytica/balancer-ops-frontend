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
