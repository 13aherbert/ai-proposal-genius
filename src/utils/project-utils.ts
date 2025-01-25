/**
 * Utility functions for project-related operations
 */

/**
 * Sanitizes a filename by removing special characters and converting to lowercase
 * @param title - The original title to sanitize
 * @param extension - The file extension to append
 * @returns A filesystem-safe filename
 */
export const createSanitizedFilename = (title: string, extension: string): string => {
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${sanitizedTitle}.${extension}`;
};

/**
 * Formats the project deadline date for display
 * @param date - The deadline date string
 * @returns Formatted date string or "Not specified" if no date
 */
export const formatDeadline = (date: string | null): string => {
  if (!date) return "Not specified";
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};