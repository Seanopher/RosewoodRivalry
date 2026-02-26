/**
 * Parse a datetime string from the API as UTC.
 * The backend stores naive datetimes (no timezone suffix) but they are always UTC.
 * Appending "Z" tells JavaScript to treat the value as UTC, so it correctly
 * converts to the user's local timezone on display.
 */
export const parseUTC = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);
  // Already has timezone info — parse as-is
  if (dateStr.endsWith('Z') || dateStr.includes('+')) return new Date(dateStr);
  return new Date(dateStr + 'Z');
};
