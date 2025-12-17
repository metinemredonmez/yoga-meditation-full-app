/**
 * Quiet Hours Utility
 * Handles timezone-aware quiet hours checking for notifications
 */

/**
 * Parse HH:mm time string to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}. Expected HH:mm`);
  }
  return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight for a timezone
 */
function getCurrentMinutesInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    return hour * 60 + minute;
  } catch {
    // Fallback to UTC if timezone is invalid
    const now = new Date();
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

/**
 * Check if current time is within quiet hours
 * Handles cases where quiet hours span midnight (e.g., 22:00 to 08:00)
 */
export function isWithinQuietHours(
  start: string | null,
  end: string | null,
  timezone: string = 'UTC',
): boolean {
  if (!start || !end) {
    return false;
  }

  try {
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = parseTimeToMinutes(end);
    const currentMinutes = getCurrentMinutesInTimezone(timezone);

    // If start is before end (e.g., 09:00 to 17:00)
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    // If start is after end (spans midnight, e.g., 22:00 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

/**
 * Get the next available time after quiet hours end
 * Returns a Date object for when notifications can resume
 */
export function getNextAvailableTime(
  start: string | null,
  end: string | null,
  timezone: string = 'UTC',
): Date | null {
  if (!start || !end) {
    return null;
  }

  try {
    const now = new Date();
    const endMinutes = parseTimeToMinutes(end);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;

    // Create a date in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1;
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);

    // Create date at quiet hours end time
    let nextAvailable = new Date(Date.UTC(year, month, day, endHours, endMins));

    // Adjust for timezone offset
    const tzOffset = getTimezoneOffset(timezone);
    nextAvailable = new Date(nextAvailable.getTime() + tzOffset * 60 * 1000);

    // If the calculated time is in the past, add a day
    if (nextAvailable <= now) {
      nextAvailable = new Date(nextAvailable.getTime() + 24 * 60 * 60 * 1000);
    }

    return nextAvailable;
  } catch {
    return null;
  }
}

/**
 * Get timezone offset in minutes from UTC
 */
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / 60000;
  } catch {
    return 0;
  }
}

/**
 * Validate time format (HH:mm)
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format quiet hours for display
 */
export function formatQuietHours(
  start: string | null,
  end: string | null,
  timezone: string = 'UTC',
): string {
  if (!start || !end) {
    return 'Not configured';
  }
  return `${start} - ${end} (${timezone})`;
}

/**
 * Calculate minutes until quiet hours end
 */
export function minutesUntilQuietHoursEnd(
  start: string | null,
  end: string | null,
  timezone: string = 'UTC',
): number | null {
  if (!isWithinQuietHours(start, end, timezone)) {
    return null;
  }

  try {
    const endMinutes = parseTimeToMinutes(end!);
    const currentMinutes = getCurrentMinutesInTimezone(timezone);
    const startMinutes = parseTimeToMinutes(start!);

    // If quiet hours span midnight
    if (startMinutes > endMinutes) {
      if (currentMinutes >= startMinutes) {
        // After start, before midnight
        return (24 * 60 - currentMinutes) + endMinutes;
      } else {
        // After midnight, before end
        return endMinutes - currentMinutes;
      }
    }

    // Normal case (same day)
    return endMinutes - currentMinutes;
  } catch {
    return null;
  }
}
