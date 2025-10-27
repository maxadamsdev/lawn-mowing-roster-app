/**
 * Date utility functions for consistent date formatting across the app
 */

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
  const date = new Date(dateString + 'T00:00:00');
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
  const primary = new Date(primaryDate + 'T00:00:00');
  
  const dayBefore = new Date(primary);
  dayBefore.setDate(dayBefore.getDate() - 1);
  
  const dayAfter = new Date(primary);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  return {
    dayBefore,
    primaryDate: primary,
    dayAfter,
    dayBeforeStr: dayBefore.toISOString().split('T')[0],
    primaryDateStr: primary.toISOString().split('T')[0],
    dayAfterStr: dayAfter.toISOString().split('T')[0],
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
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  return date.toDateString() === today.toDateString();
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
      date: date.toISOString().split('T')[0],
      day,
      isCurrentMonth: false,
    });
  }
  
  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({
      date: date.toISOString().split('T')[0],
      day,
      isCurrentMonth: true,
    });
  }
  
  // Next month days
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date: date.toISOString().split('T')[0],
      day,
      isCurrentMonth: false,
    });
  }
  
  return days;
};

