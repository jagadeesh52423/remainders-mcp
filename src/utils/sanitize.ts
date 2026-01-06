/**
 * Sanitize user input for safe use in AppleScript strings
 */
export function sanitizeForAppleScript(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Convert ISO date string to AppleScript date format
 * AppleScript expects dates in a locale-specific format
 */
export function toAppleScriptDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoDate}`);
  }

  // Format: "January 15, 2025 2:00:00 PM"
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Convert ISO date string to AppleScript all-day date format
 */
export function toAppleScriptAllDayDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoDate}`);
  }

  // Format: "January 15, 2025"
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Parse AppleScript date string to ISO format
 */
export function fromAppleScriptDate(dateStr: string): string | null {
  if (!dateStr || dateStr === "missing value" || dateStr.trim() === "") {
    return null;
  }

  const date = new Date(dateStr.trim());
  if (isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
