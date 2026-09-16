/**
 * Returns the current local time in HH:mm format (24-hour format for <input type="time" />).
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Extracts HH:mm local time string from an ISO string or Date object.
 */
export function getTimeStringFromDate(dateValue?: string | Date): string {
  if (!dateValue) return getCurrentTimeString();
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return getCurrentTimeString();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parses a YYYY-MM-DD string and optional HH:mm time string into a Date object.
 * If timeStr is provided (e.g. '14:30'), sets that exact local time.
 * If timeStr is omitted, preserves existingDate time or uses current local time.
 */
export function parseLocalDate(dateStr: string, timeOrExistingDate?: string | Date, existingDate?: string | Date): Date {
  if (!dateStr) return new Date();
  
  // Distinguish whether second parameter is timeStr ('HH:mm') or existingDate
  let timeStr: string | undefined = undefined;
  let referenceExistingDate: string | Date | undefined = existingDate;

  if (typeof timeOrExistingDate === 'string' && timeOrExistingDate.includes(':') && !timeOrExistingDate.includes('-')) {
    timeStr = timeOrExistingDate;
  } else if (timeOrExistingDate !== undefined && referenceExistingDate === undefined) {
    referenceExistingDate = timeOrExistingDate;
  }

  // Handle full ISO strings or YYYY-MM-DD
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-').map(Number);
  
  if (parts.length < 3 || parts.some(isNaN)) {
    return new Date(dateStr);
  }
  
  const [year, month, day] = parts;

  // If specific timeStr is provided (HH:mm)
  if (timeStr) {
    const timeParts = timeStr.split(':').map(Number);
    if (timeParts.length >= 2 && !timeParts.some(isNaN)) {
      const [hours, minutes] = timeParts;
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
  }

  // If an existing date was provided (e.g. when editing) and the calendar day matches, preserve its original time
  if (referenceExistingDate) {
    const prev = typeof referenceExistingDate === 'string' ? new Date(referenceExistingDate) : referenceExistingDate;
    if (!isNaN(prev.getTime())) {
      const prevDateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
      if (prevDateStr === cleanStr) {
        return new Date(year, month - 1, day, prev.getHours(), prev.getMinutes(), prev.getSeconds(), prev.getMilliseconds());
      }
    }
  }

  // Default to current local time for the selected date
  const now = new Date();
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
