/**
 * Parses a YYYY-MM-DD string into a Date object set to local noon (12:00:00).
 * Setting the time to local noon ensures that timezone conversions and DST shifts
 * never alter the intended calendar date regardless of local UTC offsets.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Handle full ISO strings or YYYY-MM-DD
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-').map(Number);
  
  if (parts.length < 3 || parts.some(isNaN)) {
    return new Date(dateStr);
  }
  
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Returns today's date string in YYYY-MM-DD format in the user's local timezone.
 * Avoids UTC shifting caused by new Date().toISOString().
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
