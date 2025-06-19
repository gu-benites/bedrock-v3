# Performance Alerts Setup Guide

## Overview

The Performance Alerts System provides automated monitoring and alerting for navigation timing degradation and other performance issues in the create-recipe workflow. This guide covers setup, configuration, and integration.

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Performance Alerts Configuration
PERFORMANCE_ALERTS_ENABLED=true
PERFORMANCE_ALERTS_CHECK_INTERVAL=30000
PERFORMANCE_ALERTS_COOLDOWN=300000
PERFORMANCE_ALERTS_MAX_PER_HOUR=10

# Alert Thresholds (in milliseconds)
PERFORMANCE_NAVIGATION_WARNING=2000
PERFORMANCE_NAVIGATION_CRITICAL=5000
PERFORMANCE_RENDER_WARNING=16
PERFORMANCE_RENDER_CRITICAL=50
PERFORMANCE_MEMORY_WARNING=100
PERFORMANCE_MEMORY_CRITICAL=200
PERFORMANCE_REGRESSION_WARNING=25
PERFORMANCE_REGRESSION_CRITICAL=50

# Slack Integration
SLACK_PERFORMANCE_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Email Alerts
EMAIL_ALERT_ENDPOINT=https://your-email-service.com/api/send
EMAIL_ALERT_TOKEN=your_email_service_token
EMAIL_ALERT_RECIPIENTS=alerts@yourcompany.com,dev-team@yourcompany.com

# Custom Webhook
CUSTOM_ALERT_WEBHOOK=https://your-monitoring-service.com/api/alerts
CUSTOM_ALERT_TOKEN=your_monitoring_token
```

## Slack Integration Setup

### 1. Create Slack Webhook

1. Go to your Slack workspace settings
2. Navigate to "Apps" → "Incoming Webhooks"
3. Click "Add to Slack"
4. Choose the channel for performance alerts
5. Copy the webhook URL

### 2. Configure Webhook

```bash
SLACK_PERFORMANCE_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Test Slack Integration

```javascript
// Test Slack alert
fetch(process.env.SLACK_PERFORMANCE_WEBHOOK, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: '🚨 Test Performance Alert',
    attachments: [{
      color: 'danger',
      fields: [
        { title: 'Metric', value: 'Navigation Time', short: true },
        { title: 'Value', value: '3.2s', short: true }
      ]
    }]
  })
});
```

## Email Alerts Setup

### 1. Email Service Integration

Choose your email service provider:

**SendGrid**
```bash
EMAIL_ALERT_ENDPOINT=https://api.sendgrid.com/v3/mail/send
EMAIL_ALERT_TOKEN=SG.your_sendgrid_api_key
```

**Mailgun**
```bash
EMAIL_ALERT_ENDPOINT=https://api.mailgun.net/v3/your-domain.com/messages
EMAIL_ALERT_TOKEN=your_mailgun_api_key
```

**Custom Service**
```bash
EMAIL_ALERT_ENDPOINT=https://your-email-api.com/send
EMAIL_ALERT_TOKEN=your_api_token
```

### 2. Email Recipients

```bash
EMAIL_ALERT_RECIPIENTS=alerts@yourcompany.com,dev-team@yourcompany.com,performance-team@yourcompany.com
```

## Alert Configuration

### 1. Performance Thresholds

```typescript
const alertConfig = {
  thresholds: {
    navigation: {
      warning: 2000,    // 2 seconds
      critical: 5000    // 5 seconds
    },
    render: {
      warning: 16,      // 16ms (60fps)
      critical: 50      // 50ms
    },
    memory: {
      warning: 100,     // 100MB
      critical: 200     // 200MB
    },
    regression: {
      warning: 25,      // 25% performance regression
      critical: 50      // 50% performance regression
    }
  }
};
```

### 2. Alert Channels

```typescript
const channels = {
  console: true,                                    // Console logging
  slack: process.env.SLACK_PERFORMANCE_WEBHOOK,    // Slack notifications
  email: process.env.EMAIL_ALERT_ENDPOINT,         // Email alerts
  custom: process.env.CUSTOM_ALERT_WEBHOOK         // Custom webhook
};
```

### 3. Rate Limiting

```typescript
const rateLimiting = {
  alertCooldown: 300000,      // 5 minutes between same alerts
  maxAlertsPerHour: 10,       // Maximum 10 alerts per hour per type
  checkInterval: 30000        // Check every 30 seconds
};
```

## Alert Types

### 1. Navigation Performance Alerts

**Triggers:**
- Average navigation time > 2 seconds (warning)
- Average navigation time > 5 seconds (critical)
- Navigation threshold violations detected

**Example Alert:**
```
🚨 PERFORMANCE ALERT [CRITICAL]: Critical navigation performance: 5200ms average
Recommendations:
- Check for network issues or server performance problems
- Review recent code changes that might affect navigation
- Consider implementing route prefetching
```

### 2. Render Performance Alerts

**Triggers:**
- Component render time > 16ms (warning)
- Component render time > 50ms (critical)
- Excessive re-renders detected (>10 per component)

**Example Alert:**
```
⚠️ PERFORMANCE ALERT [HIGH]: Excessive re-renders detected: 15 re-renders for a component
Recommendations:
- Identify components with excessive re-renders
- Optimize useEffect dependencies
- Implement proper memoization strategies
```

### 3. Memory Usage Alerts

**Triggers:**
- Memory usage > 100MB (warning)
- Memory usage > 200MB (critical)

**Example Alert:**
```
🚨 PERFORMANCE ALERT [CRITICAL]: Critical memory usage: 220MB
Recommendations:
- Check for memory leaks in components
- Review event listener cleanup
- Optimize data structures and caching
```

### 4. Performance Regression Alerts

**Triggers:**
- Performance degradation > 25% (warning)
- Performance degradation > 50% (critical)
- Critical performance test failures

**Example Alert:**
```
🚨 PERFORMANCE ALERT [CRITICAL]: Critical performance regression: Navigation Test degraded by 65.2%
Recommendations:
- Review recent code changes that might cause regression
- Run performance regression tests
- Consider rolling back recent changes
```

## Visual Interface

### Performance Alerts Panel

**Keyboard Shortcut:** `Ctrl+Shift+A`

**Features:**
- Real-time active alerts display
- Alert history tracking
- Alert resolution controls
- Configuration management
- Severity-based color coding

**Alert Display:**
```
🚨 NAVIGATION                    [Resolve]
Critical navigation performance: 5200ms average
Current: 5.20s  Threshold: 5.00s
Route: /create-recipe/demographics

Recommendations:
• Check for network issues or server performance problems
• Review recent code changes that might affect navigation
```

## Integration Examples

### 1. Custom Alert Handler

```typescript
import { performanceAlerts } from '@/lib/monitoring/performance-alerts';

// Custom alert processing
performanceAlerts.updateConfig({
  channels: {
    console: true,
    custom: async (alert) => {
      // Custom alert processing
      await sendToMonitoringService(alert);
      await updateDashboard(alert);
      await notifyTeam(alert);
    }
  }
});
```

### 2. Alert Webhook Integration

```typescript
// Custom webhook endpoint
app.post('/api/performance-alerts', (req, res) => {
  const { alert } = req.body;
  
  // Process alert
  if (alert.severity === 'critical') {
    // Trigger incident response
    await createIncident(alert);
    await notifyOnCall(alert);
  }
  
  // Store in monitoring system
  await storeAlert(alert);
  
  res.json({ success: true });
});
```

### 3. Dashboard Integration

```typescript
// Performance dashboard
const PerformanceDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(performanceAlerts.getActiveAlerts());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h2>Performance Status</h2>
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
};
```

## Monitoring Best Practices

### 1. Alert Tuning

```typescript
// ✅ Good: Realistic thresholds based on user research
const realisticThresholds = {
  navigation: { warning: 2000, critical: 5000 },
  render: { warning: 16, critical: 50 }
};

// ❌ Bad: Too strict thresholds causing alert fatigue
const strictThresholds = {
  navigation: { warning: 500, critical: 1000 },
  render: { warning: 5, critical: 10 }
};
```

### 2. Alert Fatigue Prevention

```typescript
// Rate limiting configuration
const rateLimiting = {
  alertCooldown: 300000,      // 5 minutes between same alerts
  maxAlertsPerHour: 10,       // Prevent alert spam
  checkInterval: 30000        // Reasonable check frequency
};
```

### 3. Actionable Alerts

```typescript
// ✅ Good: Specific, actionable recommendations
const goodAlert = {
  description: 'Navigation time exceeded 5 seconds on /create-recipe/demographics',
  recommendations: [
    'Check server response times for this specific route',
    'Review component loading strategies for demographics form',
    'Consider implementing route prefetching for this step'
  ]
};

// ❌ Bad: Vague, non-actionable alerts
const badAlert = {
  description: 'Performance is slow',
  recommendations: ['Fix performance issues']
};
```

## Troubleshooting

### Common Issues

1. **Alerts Not Triggering**
   - Check if monitoring is enabled
   - Verify threshold configuration
   - Review console for errors

2. **Too Many Alerts**
   - Adjust thresholds to realistic values
   - Increase cooldown periods
   - Review rate limiting settings

3. **Slack/Email Not Working**
   - Verify webhook URLs and tokens
   - Check network connectivity
   - Test endpoints manually

### Debug Commands

```javascript
// Check alert system status
console.log(performanceAlerts.getActiveAlerts());
console.log(performanceAlerts.getAlertHistory());

// Test alert creation
performanceAlerts.createAlert({
  type: 'navigation',
  severity: 'high',
  metric: 'testMetric',
  currentValue: 3000,
  threshold: 2000,
  description: 'Test alert'
});

// Update configuration
performanceAlerts.updateConfig({
  thresholds: {
    navigation: { warning: 1500, critical: 4000 }
  }
});
```

---

**Last Updated**: 2025-06-19  
**Status**: ✅ Implemented and Active  
**Next Review**: 2025-07-19
