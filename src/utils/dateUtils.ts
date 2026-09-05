/**
 * Parses a YYYY-MM-DD string into a Date object.
 * Preserves current local time (or original reference time) instead of hardcoding noon (12:00 PM),
 * ensuring that transactions created throughout the day are accurately ordered chronologically.
 */
export function parseLocalDate(dateStr: string, existingDate?: string | Date): Date {
  if (!dateStr) return new Date();
  
  // Handle full ISO strings or YYYY-MM-DD
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-').map(Number);
  
  if (parts.length < 3 || parts.some(isNaN)) {
    return new Date(dateStr);
  }
  
  const [year, month, day] = parts;
  const now = new Date();

  // If an existing date was provided (e.g. when editing) and the calendar day matches, preserve its original time
  if (existingDate) {
    const prev = typeof existingDate === 'string' ? new Date(existingDate) : existingDate;
    if (!isNaN(prev.getTime())) {
      const prevDateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
      if (prevDateStr === cleanStr) {
        return new Date(year, month - 1, day, prev.getHours(), prev.getMinutes(), prev.getSeconds(), prev.getMilliseconds());
      }
    }
  }

  // Use current local time for the selected date
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
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
