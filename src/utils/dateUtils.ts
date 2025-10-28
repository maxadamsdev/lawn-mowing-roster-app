/**
 * Date utility functions for consistent date formatting across the app
 * All dates are handled in local timezone (NZST/NZDT for New Zealand)
 * Using local timezone prevents UTC conversion issues that cause date shifts
 */

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 * This ensures dates are interpreted as local time, not UTC
 */
export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in local timezone (not UTC)
  // Using the Date constructor with individual components creates a local date
  return new Date(year, month - 1, day);
};

/**
 * Format a date string (YYYY-MM-DD) to a readable format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string => {
  const date = parseDateString(dateString);
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format a date string to short format (e.g., "Fri, Oct 24")
 */
export const formatDateShort = (dateString: string): string => {
  return formatDate(dateString, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format a date string to include year (e.g., "Fri, Oct 24, 2025")
 */
export const formatDateShortWithYear = (dateString: string): string => {
  return formatDate(dateString, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get the 3-day window for a session (day before, primary, day after)
 */
export const getSessionDateRange = (primaryDate: string): {
  dayBefore: Date;
  primaryDate: Date;
  dayAfter: Date;
  dayBeforeStr: string;
  primaryDateStr: string;
  dayAfterStr: string;
} => {
  const primary = parseDateString(primaryDate);
  
  const dayBefore = new Date(primary);
  dayBefore.setDate(dayBefore.getDate() - 1);
  
  const dayAfter = new Date(primary);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  return {
    dayBefore,
    primaryDate: primary,
    dayAfter,
    dayBeforeStr: formatDateToYYYYMMDD(dayBefore),
    primaryDateStr: formatDateToYYYYMMDD(primary),
    dayAfterStr: formatDateToYYYYMMDD(dayAfter),
  };
};

/**
 * Format a date range (e.g., "Fri, Oct 24 - Sun, Oct 26, 2025")
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = formatDate(startDate, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const end = formatDate(endDate, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  return `${start} - ${end}`;
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  return formatDateToYYYYMMDD(today);
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = parseDateString(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDateString();
};

/**
 * Get calendar days for a given month
 */
export const getCalendarDays = (year: number, month: number): Array<{
  date: string;
  day: number;
  isCurrentMonth: boolean;
}> => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevLastDay = new Date(year, month, 0);
  
  const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
  
  // Previous month days
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevLastDay.getDate() - i;
    const date = new Date(year, month - 1, day);
    days.push({
      date: formatDateToYYYYMMDD(date),
      day,
      isCurrentMonth: false,
    });
  }
  
  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({
      date: formatDateToYYYYMMDD(date),
      day,
      isCurrentMonth: true,
    });
  }
  
  // Next month days
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date: formatDateToYYYYMMDD(date),
      day,
      isCurrentMonth: false,
    });
  }
  
  return days;
};

