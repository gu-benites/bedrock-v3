# Core Web Vitals Monitoring

## Overview

Core Web Vitals monitoring provides real-time tracking of essential user experience metrics in production. The system automatically collects, analyzes, and reports on key performance indicators that directly impact user satisfaction and SEO rankings.

## Core Web Vitals Metrics

### 1. Largest Contentful Paint (LCP)
- **Measures**: Loading performance
- **Good**: ≤ 2.5 seconds
- **Needs Improvement**: 2.5 - 4.0 seconds
- **Poor**: > 4.0 seconds

### 2. First Input Delay (FID)
- **Measures**: Interactivity
- **Good**: ≤ 100 milliseconds
- **Needs Improvement**: 100 - 300 milliseconds
- **Poor**: > 300 milliseconds

### 3. Cumulative Layout Shift (CLS)
- **Measures**: Visual stability
- **Good**: ≤ 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25

### 4. Additional Metrics

**First Contentful Paint (FCP)**
- **Good**: ≤ 1.8 seconds
- **Needs Improvement**: 1.8 - 3.0 seconds
- **Poor**: > 3.0 seconds

**Time to First Byte (TTFB)**
- **Good**: ≤ 800 milliseconds
- **Needs Improvement**: 800 - 1800 milliseconds
- **Poor**: > 1800 milliseconds

**Interaction to Next Paint (INP)**
- **Good**: ≤ 200 milliseconds
- **Needs Improvement**: 200 - 500 milliseconds
- **Poor**: > 500 milliseconds

## Implementation

### 1. Core Web Vitals Monitor

**Location**: `src/lib/monitoring/core-web-vitals.ts`

```typescript
import { coreWebVitalsMonitor } from '@/lib/monitoring/core-web-vitals';

// Monitor is automatically initialized in production
// Configuration can be updated:
coreWebVitalsMonitor.updateConfig({
  sampleRate: 0.2,        // Monitor 20% of sessions
  bufferSize: 5,          // Send after 5 metrics
  sendInterval: 15000     // Send every 15 seconds
});
```

### 2. Web Vitals Provider

**Location**: `src/components/monitoring/web-vitals-provider.tsx`

Integrated into the root layout for automatic monitoring:

```typescript
import { WebVitalsProvider } from '@/components/monitoring/web-vitals-provider';

export default function RootLayout({ children }) {
  return (
    <WebVitalsProvider
      enabled={process.env.NODE_ENV === 'production'}
      sampleRate={0.1}
      reportingEndpoint="/api/analytics/web-vitals"
    >
      {children}
    </WebVitalsProvider>
  );
}
```

### 3. API Endpoint

**Location**: `src/app/api/analytics/web-vitals/route.ts`

Receives and processes Core Web Vitals data:

```typescript
// POST /api/analytics/web-vitals
{
  "type": "web-vitals",
  "data": [
    {
      "metric": {
        "name": "LCP",
        "value": 2100,
        "rating": "good"
      },
      "timestamp": 1640995200000,
      "url": "/create-recipe/demographics",
      "sessionId": "session_123",
      "route": "/create-recipe/demographics",
      "feature": "create-recipe"
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# Core Web Vitals Configuration
NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE=0.1
NEXT_PUBLIC_WEB_VITALS_ENDPOINT=/api/analytics/web-vitals

# Analytics Integration
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_ga4_api_secret
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
CUSTOM_ANALYTICS_ENDPOINT=https://your-analytics.com/api/events
CUSTOM_ANALYTICS_TOKEN=your_analytics_token

# Alerting Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL_ENDPOINT=https://your-email-service.com/api/send
ALERT_EMAIL_TOKEN=your_email_token
ALERT_EMAIL_RECIPIENTS=alerts@yourcompany.com,dev-team@yourcompany.com
```

### Monitoring Configuration

```typescript
interface WebVitalConfig {
  enabled: boolean;                    // Enable/disable monitoring
  reportingEndpoint: string;           // API endpoint for data
  sampleRate: number;                  // 0-1, percentage of sessions
  bufferSize: number;                  // Metrics to buffer before sending
  sendInterval: number;                // Send interval in milliseconds
  thresholds: {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 }
  }
}
```

## Analytics Integration

### 1. Google Analytics 4

Automatic integration with GA4 for Core Web Vitals tracking:

```typescript
// Sent as custom events to GA4
{
  "name": "web_vital",
  "params": {
    "metric_name": "LCP",
    "metric_value": 2100,
    "metric_rating": "good",
    "route": "/create-recipe/demographics",
    "feature": "create-recipe"
  }
}
```

### 2. Vercel Analytics

Integration with Vercel's Web Vitals dashboard:

```typescript
// Sent to Vercel Analytics endpoint
{
  "events": [
    {
      "type": "web-vital",
      "name": "LCP",
      "value": 2100,
      "rating": "good",
      "route": "/create-recipe/demographics"
    }
  ]
}
```

### 3. Custom Analytics

Support for custom analytics platforms:

```typescript
// Flexible format for custom analytics
{
  "type": "web-vitals",
  "metrics": [...],
  "timestamp": 1640995200000,
  "environment": "production",
  "version": "1.0.0"
}
```

## Alerting System

### 1. Performance Alerts

Automatic alerts for poor Core Web Vitals:

```typescript
// Alert triggered when metrics exceed thresholds
{
  "type": "performance-alert",
  "severity": "high",
  "metric": "LCP",
  "route": "/create-recipe/demographics",
  "averageValue": 4200,
  "occurrences": 5,
  "environment": "production"
}
```

### 2. Slack Integration

Real-time Slack notifications for performance issues:

```typescript
// Slack message format
{
  "text": "🚨 Performance Alert: Poor LCP on /create-recipe/demographics",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Performance Alert*\n*Metric:* LCP\n*Route:* /create-recipe/demographics\n*Average Value:* 4.20s\n*Occurrences:* 5"
      }
    }
  ]
}
```

### 3. Email Alerts

Email notifications for critical performance issues:

```html
<h2>Performance Alert</h2>
<p><strong>Metric:</strong> LCP</p>
<p><strong>Route:</strong> /create-recipe/demographics</p>
<p><strong>Average Value:</strong> 4.20s</p>
<p><strong>Occurrences:</strong> 5</p>
<p><strong>Environment:</strong> production</p>
```

## Development Tools

### 1. Debug Panel

**Keyboard Shortcut**: `Ctrl+Shift+V` to toggle

Visual debug panel showing:
- Monitoring status
- Session information
- Recent metrics
- Real-time updates

### 2. Console Logging

Development mode logging:

```javascript
// Metric logging
📊 LCP: 2.10 (good) { metric: {...}, timestamp: 1640995200000 }

// Warning for poor metrics
⚠️ Poor LCP detected: 4.20 { threshold: 4000, url: "/create-recipe", route: "/create-recipe" }

// Status updates
📊 Core Web Vitals monitoring initialized
📊 Sent 5 web vital metrics
```

### 3. Manual Controls

```typescript
import { useWebVitals } from '@/components/monitoring/web-vitals-provider';

const { summary, flush, updateConfig } = useWebVitals();

// Force send buffered metrics
await flush();

// Update configuration
updateConfig({ sampleRate: 0.5 });

// Check monitoring status
console.log('Monitoring:', summary.isMonitoring);
```

## Data Analysis

### 1. Performance Trends

Track performance over time:

```typescript
// Weekly performance summary
{
  "period": "2025-01-13 to 2025-01-19",
  "metrics": {
    "LCP": { "average": 2.1, "p95": 3.2, "trend": "improving" },
    "FID": { "average": 85, "p95": 150, "trend": "stable" },
    "CLS": { "average": 0.05, "p95": 0.12, "trend": "degrading" }
  },
  "routes": {
    "/create-recipe/demographics": { "LCP": 1.8, "rating": "good" },
    "/create-recipe/causes": { "LCP": 2.4, "rating": "good" },
    "/create-recipe/symptoms": { "LCP": 2.8, "rating": "needs-improvement" }
  }
}
```

### 2. Route-Specific Analysis

Performance breakdown by route:

```typescript
// Route performance comparison
{
  "/create-recipe/demographics": {
    "sessions": 1250,
    "LCP": { "average": 1.8, "good": 85%, "poor": 5% },
    "FID": { "average": 75, "good": 92%, "poor": 2% },
    "CLS": { "average": 0.04, "good": 88%, "poor": 8% }
  },
  "/create-recipe/symptoms": {
    "sessions": 980,
    "LCP": { "average": 2.8, "good": 65%, "poor": 15% },
    "FID": { "average": 95, "good": 88%, "poor": 5% },
    "CLS": { "average": 0.08, "good": 82%, "poor": 12% }
  }
}
```

### 3. Device and Connection Analysis

Performance by device and connection type:

```typescript
// Device performance breakdown
{
  "desktop": {
    "LCP": { "average": 1.9, "good": 88% },
    "FID": { "average": 65, "good": 95% }
  },
  "mobile": {
    "LCP": { "average": 2.6, "good": 72% },
    "FID": { "average": 105, "good": 85% }
  },
  "connection": {
    "4g": { "LCP": 2.1, "sessions": 60% },
    "3g": { "LCP": 3.2, "sessions": 25% },
    "wifi": { "LCP": 1.8, "sessions": 15% }
  }
}
```

## Best Practices

### 1. Sampling Strategy

```typescript
// ✅ Good: Appropriate sampling rates
const productionConfig = {
  sampleRate: 0.1,        // 10% for production
  bufferSize: 10,         // Reasonable buffer
  sendInterval: 30000     // 30 second intervals
};

// ❌ Bad: Too aggressive sampling
const badConfig = {
  sampleRate: 1.0,        // 100% - too much data
  bufferSize: 1,          // Send every metric
  sendInterval: 1000      // Every second - too frequent
};
```

### 2. Alert Configuration

```typescript
// ✅ Good: Meaningful alert thresholds
const alertConfig = {
  LCP: { alertThreshold: 4000, criticalThreshold: 6000 },
  FID: { alertThreshold: 300, criticalThreshold: 500 },
  CLS: { alertThreshold: 0.25, criticalThreshold: 0.5 }
};

// ❌ Bad: Too sensitive alerts
const badAlertConfig = {
  LCP: { alertThreshold: 2000 },  // Too strict
  FID: { alertThreshold: 50 }     // Unrealistic
};
```

### 3. Data Retention

```typescript
// ✅ Good: Appropriate data retention
const retentionPolicy = {
  rawMetrics: '30 days',
  aggregatedDaily: '1 year',
  aggregatedWeekly: '2 years'
};
```

## Troubleshooting

### Common Issues

1. **No Metrics Being Collected**
   - Check if monitoring is enabled in production
   - Verify sample rate configuration
   - Check browser console for errors

2. **High Alert Volume**
   - Review alert thresholds
   - Check for performance regressions
   - Analyze traffic patterns

3. **Missing Route Data**
   - Verify route extraction logic
   - Check URL patterns
   - Review feature classification

### Debug Commands

```javascript
// Check monitoring status
console.log(coreWebVitalsMonitor.getMetricsSummary());

// Force flush metrics
await coreWebVitalsMonitor.flush();

// Update configuration
coreWebVitalsMonitor.updateConfig({ sampleRate: 1.0 });

// Check recent metrics (development only)
console.log('Recent metrics:', window.webVitalsDebugData);
```

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
