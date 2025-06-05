// Export centralized error handling utilities
export { handleError, logEvent } from './error-handler';

// Type definition for ErrorContext
export type ErrorContext = {
  userId?: string;
  operation?: string;
  component?: string;
  path?: string;
  [key: string]: any;
};
