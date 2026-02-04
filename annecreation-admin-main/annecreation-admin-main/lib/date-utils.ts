import moment from 'moment';

/**
 * Format date to IST timezone
 * Format: 25 Apr 2025 10:20 PM
 */
export const formatDateIST = (date: string | Date): string => {
  if (!date) return '-';
  
  // Parse the date and format it
  return moment(date).format('DD MMM YYYY hh:mm A');
};

/**
 * Format date to IST timezone (date only)
 * Format: 25 Apr 2025
 */
export const formatDateOnlyIST = (date: string | Date): string => {
  if (!date) return '-';
  
  return moment(date).format('DD MMM YYYY');
};

/**
 * Format date to IST timezone (time only)
 * Format: 10:20 PM
 */
export const formatTimeOnlyIST = (date: string | Date): string => {
  if (!date) return '-';
  
  return moment(date).format('hh:mm A');
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  if (!date) return '-';
  
  return moment(date).fromNow();
};

