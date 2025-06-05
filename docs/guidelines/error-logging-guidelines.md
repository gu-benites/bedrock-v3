# Error Logging Guidelines

This document provides standardized guidelines for error logging and reporting across the entire application. Follow these patterns to ensure consistent, secure, and effective error tracking.

## Architecture Overview

Our error logging architecture uses:
- **Winston** for server-side logging with structured JSON format
- **SentryWinstonTransport** for automatic Sentry integration (warn/error levels)
- **Sentry** for client-side error reporting and performance monitoring
- **Conditional console logging** for development environments

## Server-Side Logging with Winston

### Basic Setup

Always import and configure the logger with a specific module name:

```typescript
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('ModuleName'); // Use PascalCase for module names
```

### Module Naming Convention

Use descriptive, PascalCase module names that clearly identify the component:

```typescript
// ✅ Good examples
const logger = getServerLogger('AuthStateService');
const logger = getServerLogger('UserProfileService');
const logger = getServerLogger('PaymentProcessor');
const logger = getServerLogger('EmailNotificationService');

// ❌ Avoid generic names
const logger = getServerLogger('auth');
const logger = getServerLogger('service');
const logger = getServerLogger('utils');
```

### Log Levels and When to Use Them

#### `logger.info()` - Significant Events
Use for expected events worth tracking:

```typescript
// Successful operations
logger.info('User signed in successfully', {
  userId: maskedUserId,
  operation: 'signInWithPassword'
});

// Expected auth states
logger.info('User not authenticated', {
  message: 'Auth session missing!',
  operation: 'getServerAuthState'
});

// Business logic events
logger.info('Profile updated successfully', {
  userId: maskedUserId,
  operation: 'updateUserProfile'
});
```

#### `logger.warn()` - Non-Critical Issues
Use for issues that should be investigated but don't prevent functionality:

```typescript
// Authentication issues (sent to Sentry via Winston transport)
logger.warn('Authentication error', {
  error: error.message,
  status: error.status,
  operation: 'getServerAuthState'
});

// Network/timeout errors
logger.warn('Request failed', {
  error: error.message,
  url: request.url,
  operation: 'fetchExternalData'
});

// Validation warnings
logger.warn('Invalid input received', {
  field: 'email',
  value: maskedEmail,
  operation: 'validateUserInput'
});
```

#### `logger.error()` - Critical Failures
Use for errors that prevent functionality:

```typescript
// Critical system errors (sent to Sentry via Winston transport)
logger.error('Critical error in auth state service', {
  error: error.message,
  stack: error.stack,
  operation: 'getServerAuthState'
});

// Database errors
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  operation: 'connectToDatabase'
});

// Unexpected application errors
logger.error('Unexpected error processing payment', {
  error: error.message,
  stack: error.stack,
  userId: maskedUserId,
  operation: 'processPayment'
});
```

#### `logger.debug()` - Development Information
Use sparingly for detailed troubleshooting (development only):

```typescript
// Only in development environments
if (process.env.NODE_ENV === 'development') {
  logger.debug('Detailed operation info', {
    step: 'validation',
    data: sanitizedData,
    operation: 'complexOperation'
  });
}
```

### Log Context Structure

Always include structured context with consistent fields:

```typescript
logger.info('Operation completed', {
  // Required fields
  operation: 'functionName', // Always include the operation name
  
  // User identification (always masked)
  userId: maskedUserId,
  
  // Error information (for warn/error levels)
  error: error.message,
  stack: error.stack,
  
  // Additional context
  status: response.status,
  duration: Date.now() - startTime,
  
  // Custom fields relevant to the operation
  customField: 'value'
});
```

### PII Masking Requirements

**Always mask personally identifiable information** in logs:

```typescript
// ✅ Correct PII masking
const maskedUserId = userId ? `${userId.substring(0, 6)}...` : 'none';
const maskedEmail = email ? `${email.substring(0, 3)}***` : 'none';

logger.info('User operation', {
  userId: maskedUserId,
  email: maskedEmail,
  operation: 'userOperation'
});

// ❌ Never log raw PII
logger.info('User operation', {
  userId: 'actual-user-id-12345',
  email: 'user@example.com'
});
```

### SentryWinstonTransport Integration

**Important**: Warn and error level logs are automatically sent to Sentry via the SentryWinstonTransport. Document this in key services:

```typescript
/**
 * Service description
 * 
 * Note: All warn/error level logs are automatically sent to Sentry
 * via the SentryWinstonTransport configured in winston.config.ts
 */
export async function serviceFunction() {
  // Implementation
}
```

## Client-Side Error Reporting with Sentry

### Basic Error Reporting

Use `Sentry.captureException` for caught errors:

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Operation that might fail
} catch (error) {
  // Dev-only console logging
  if (process.env.NODE_ENV === 'development') {
    console.error('[ComponentName] Error:', error.message);
  }
  
  // Always report to Sentry with context
  Sentry.captureException(error, {
    tags: { 
      component: 'ComponentName', 
      type: 'errorType',
      operation: 'operationName'
    },
    extra: { 
      userId: maskedUserId,
      operation: 'operationName',
      message: 'Descriptive error context'
    }
  });
}
```

### Conditional Console Logging

**Only log to console in development** with feature flags:

```typescript
// General development logging
const shouldLog = process.env.NODE_ENV === 'development';

// Feature-specific debug flags
const debugAuth = process.env.NODE_ENV === 'development' && 
                  process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

if (debugAuth) {
  console.log('[AuthComponent] State changed:', state);
}
```

### Error Context and Tagging

Use consistent tags and context structure:

```typescript
Sentry.captureException(error, {
  tags: {
    component: 'ComponentName',    // Component where error occurred
    type: 'errorType',            // Type of error (authError, networkError, etc.)
    operation: 'operationName'    // Specific operation that failed
  },
  extra: {
    userId: maskedUserId,         // Always mask PII
    operation: 'operationName',   // Duplicate for searchability
    message: 'Context description',
    // Additional relevant context
    customField: 'value'
  }
});
```

### PII Masking in Client Reports

**Always mask PII** in client-side error reports:

```typescript
// ✅ Correct client-side PII masking
const maskedUserId = user?.id ? `${user.id.substring(0, 6)}...` : 'none';
const maskedEmail = user?.email ? `${user.email.substring(0, 3)}***` : 'none';

Sentry.captureException(error, {
  tags: { component: 'UserProfile' },
  extra: {
    userId: maskedUserId,
    email: maskedEmail
  }
});

// ❌ Never include raw PII
Sentry.captureException(error, {
  extra: {
    userId: user.id,
    email: user.email
  }
});
```

## Common Scenarios and Examples

### Authentication Errors

```typescript
// Server-side authentication error
if (error.message === "Auth session missing!") {
  // Expected - info level (not sent to Sentry)
  logger.info('User not authenticated', {
    message: error.message,
    operation: 'getServerAuthState'
  });
} else if (error.status === 401 || error.status === 403) {
  // Authentication issue - warn level (sent to Sentry)
  logger.warn('Authentication error', {
    error: error.message,
    status: error.status,
    operation: 'getServerAuthState'
  });
} else {
  // Critical error - error level (sent to Sentry)
  logger.error('Critical authentication error', {
    error: error.message,
    stack: error.stack,
    operation: 'getServerAuthState'
  });
}

// Client-side authentication error
Sentry.captureException(error, {
  tags: { component: 'AuthProvider', type: 'authError' },
  extra: {
    userId: maskedUserId,
    operation: 'getSession',
    message: 'Authentication error in client'
  }
});
```

### Database Operation Errors

```typescript
// Server-side database error
try {
  const result = await database.query(sql, params);
} catch (error) {
  logger.error('Database query failed', {
    error: error.message,
    stack: error.stack,
    query: 'getUserProfile', // Don't include actual SQL with potential PII
    operation: 'getUserProfile'
  });
  throw error;
}
```

### API Request Failures

```typescript
// Server-side API request error
try {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    logger.warn('External API request failed', {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      operation: 'fetchExternalData'
    });
  }
} catch (error) {
  logger.error('Critical error calling external API', {
    error: error.message,
    stack: error.stack,
    url: apiUrl,
    operation: 'fetchExternalData'
  });
}

// Client-side API request error
try {
  const response = await api.call();
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[ApiClient] Request failed:', error.message);
  }

  Sentry.captureException(error, {
    tags: { component: 'ApiClient', type: 'networkError' },
    extra: {
      operation: 'apiCall',
      endpoint: '/api/endpoint',
      message: 'API request failed'
    }
  });
}
```

### User Input Validation Errors

```typescript
// Server-side validation error
const validationResult = schema.safeParse(input);
if (!validationResult.success) {
  const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';

  logger.info('Input validation failed', {
    error: errorMessage,
    field: 'email', // Field name, not value
    operation: 'validateUserInput'
  });

  return { success: false, error: errorMessage };
}

// Client-side validation error
if (validationError) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[FormComponent] Validation failed:', validationError.message);
  }

  // Only report unexpected validation errors to Sentry
  if (validationError.type === 'unexpected') {
    Sentry.captureException(validationError, {
      tags: { component: 'FormComponent', type: 'validationError' },
      extra: {
        operation: 'validateForm',
        field: validationError.field,
        message: 'Unexpected validation error'
      }
    });
  }
}
```

## Best Practices

### Error Message Formatting

```typescript
// ✅ Good error messages - descriptive and actionable
logger.error('Failed to process payment', {
  error: error.message,
  paymentId: maskedPaymentId,
  operation: 'processPayment'
});

// ❌ Poor error messages - vague and unhelpful
logger.error('Error', { error: error.message });
```

### Context Data Structure

```typescript
// ✅ Consistent context structure
const logContext = {
  // Always include operation
  operation: 'functionName',

  // Include relevant IDs (masked)
  userId: maskedUserId,
  requestId: requestId,

  // Include error details for warn/error levels
  error: error.message,
  stack: error.stack,

  // Include timing information when relevant
  duration: Date.now() - startTime,

  // Include business context
  feature: 'authentication',
  step: 'validation'
};
```

### Performance Considerations

```typescript
// ✅ Efficient logging - avoid expensive operations
logger.info('Operation completed', {
  operation: 'expensiveOperation',
  duration: Date.now() - startTime,
  // Don't serialize large objects
  resultCount: results.length
});

// ❌ Inefficient logging - expensive serialization
logger.info('Operation completed', {
  operation: 'expensiveOperation',
  // Avoid logging large objects
  fullResults: results,
  // Avoid expensive computations in log context
  complexCalculation: expensiveFunction()
});
```

### Security Considerations

```typescript
// ✅ Secure logging practices
logger.info('User action performed', {
  userId: maskedUserId,
  action: 'updateProfile',
  // Log metadata, not sensitive data
  fieldsUpdated: ['name', 'preferences'],
  operation: 'updateUserProfile'
});

// ❌ Insecure logging - exposes sensitive data
logger.info('User action performed', {
  userId: user.id,
  // Never log passwords, tokens, or sensitive data
  password: user.password,
  apiKey: user.apiKey,
  personalData: user.sensitiveInfo
});
```

## Environment-Specific Behavior

### Development Environment
- Console logging is enabled with debug flags
- More verbose logging for troubleshooting
- Stack traces included in console output

### Production Environment
- Console logging is disabled
- Only structured logs to Winston
- Automatic Sentry reporting for warn/error levels
- PII masking is critical

## Integration with Existing Architecture

### Winston Configuration
Our Winston logger is configured with:
- JSON formatting for structured logs
- Multiple transports (file, console, Sentry)
- Automatic log rotation
- Environment-specific log levels

### SentryWinstonTransport
- Automatically sends warn/error logs to Sentry
- Preserves log context as Sentry extra data
- Maintains correlation between Winston and Sentry
- Configured in `winston.config.ts`

### Sentry Configuration
- Client-side error reporting and performance monitoring
- User context tracking (with PII masking)
- Breadcrumb tracking for user actions
- Release and environment tagging

## Troubleshooting Common Issues

### Duplicate Sentry Reports
```typescript
// ✅ Avoid duplicate reports - use Winston for server errors
logger.error('Server error', context); // Auto-sent to Sentry

// ❌ Don't manually send server errors to Sentry
logger.error('Server error', context);
Sentry.captureException(error); // Creates duplicate
```

### Missing Context
```typescript
// ✅ Always include operation context
logger.warn('Operation failed', {
  operation: 'specificFunction',
  error: error.message
});

// ❌ Missing context makes debugging difficult
logger.warn('Operation failed', { error: error.message });
```

### PII Leakage
```typescript
// ✅ Always mask PII before logging
const maskedData = {
  userId: userId.substring(0, 6) + '...',
  email: email.substring(0, 3) + '***'
};

// ❌ Raw PII in logs violates privacy
logger.info('User data', { userId, email });
```

## Quick Reference

### Server-Side Checklist
- [ ] Use `getServerLogger('ModuleName')`
- [ ] Include `operation` in all log contexts
- [ ] Mask all PII (userIds, emails, etc.)
- [ ] Use appropriate log levels (info/warn/error)
- [ ] Document SentryWinstonTransport integration

### Client-Side Checklist
- [ ] Use conditional console logging for development
- [ ] Report errors to Sentry with proper context
- [ ] Include component, type, and operation tags
- [ ] Mask all PII in Sentry reports
- [ ] Use meaningful error messages

### Security Checklist
- [ ] No raw PII in any logs
- [ ] No sensitive data (passwords, tokens, etc.)
- [ ] Proper error message sanitization
- [ ] Environment-appropriate logging levels
