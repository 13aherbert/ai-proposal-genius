/**
 * Utility functions for project-related operations
 */

import { Project } from "@/hooks/use-project-details";

/**
 * Formats project status for display with proper capitalization
 */
export const formatProjectStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Formats the project deadline date for display
 */
export const formatDeadline = (date: string | null): string => {
  if (!date) return "Not specified";
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Checks if a project has all required information filled out
 */
export const isProjectComplete = (project: Project): boolean => {
  return !!(
    project.title &&
    project.client_name &&
    project.business_name &&
    project.deadline
  );
};