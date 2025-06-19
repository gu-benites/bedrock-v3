/**
 * Core Web Vitals API Endpoint
 * Receives and processes Core Web Vitals metrics from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
  entries: PerformanceEntry[];
}

interface WebVitalData {
  metric: WebVitalMetric;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  sessionId: string;
  userId?: string;
  route: string;
  feature: string;
}

interface WebVitalsPayload {
  type: 'web-vitals' | 'critical-web-vital';
  data: WebVitalData[];
}

/**
 * Process and store Core Web Vitals metrics
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const clientIP = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';

    const payload: WebVitalsPayload = await request.json();

    // Validate payload
    if (!payload.type || !Array.isArray(payload.data)) {
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Process each metric
    const processedMetrics = payload.data.map(webVitalData => {
      const processedData = {
        ...webVitalData,
        serverTimestamp: Date.now(),
        clientIP,
        serverUserAgent: userAgent,
        environment: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      };

      // Log critical metrics
      if (payload.type === 'critical-web-vital' || webVitalData.metric.rating === 'poor') {
        console.warn(`🚨 Critical Web Vital: ${webVitalData.metric.name} = ${webVitalData.metric.value.toFixed(2)} (${webVitalData.metric.rating})`, {
          route: webVitalData.route,
          feature: webVitalData.feature,
          sessionId: webVitalData.sessionId,
          url: webVitalData.url
        });
      }

      return processedData;
    });

    // Store metrics (implement based on your analytics service)
    await storeWebVitals(processedMetrics);

    // Send to external analytics services
    await sendToAnalyticsServices(processedMetrics);

    // Check for performance alerts
    await checkPerformanceAlerts(processedMetrics);

    return NextResponse.json({ 
      success: true, 
      processed: processedMetrics.length 
    });

  } catch (error) {
    console.error('Error processing web vitals:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Store web vitals metrics
 */
async function storeWebVitals(metrics: any[]): Promise<void> {
  // Implement based on your storage solution
  // Examples: Database, Analytics service, Log aggregation
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Storing web vitals metrics:', metrics.length);
    return;
  }

  try {
    // Example: Store in database
    // await db.webVitals.createMany({ data: metrics });

    // Example: Store in analytics service
    // await analyticsService.track('web-vitals', metrics);

    // Example: Send to logging service
    // await logger.info('web-vitals', { metrics });

    console.log(`📊 Stored ${metrics.length} web vitals metrics`);

  } catch (error) {
    console.error('Failed to store web vitals:', error);
    // Don't throw - we don't want to fail the request if storage fails
  }
}

/**
 * Send metrics to external analytics services
 */
async function sendToAnalyticsServices(metrics: any[]): Promise<void> {
  const promises: Promise<void>[] = [];

  // Google Analytics 4
  if (process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET) {
    promises.push(sendToGA4(metrics));
  }

  // Vercel Analytics
  if (process.env.VERCEL_ANALYTICS_ID) {
    promises.push(sendToVercelAnalytics(metrics));
  }

  // Custom analytics endpoint
  if (process.env.CUSTOM_ANALYTICS_ENDPOINT) {
    promises.push(sendToCustomAnalytics(metrics));
  }

  // Execute all analytics calls in parallel
  await Promise.allSettled(promises);
}

/**
 * Send to Google Analytics 4
 */
async function sendToGA4(metrics: any[]): Promise<void> {
  try {
    const events = metrics.map(metric => ({
      name: 'web_vital',
      params: {
        metric_name: metric.metric.name,
        metric_value: metric.metric.value,
        metric_rating: metric.metric.rating,
        route: metric.route,
        feature: metric.feature,
        session_id: metric.sessionId,
        user_id: metric.userId
      }
    }));

    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: metrics[0]?.sessionId || 'unknown',
        events
      })
    });

    console.log(`📊 Sent ${metrics.length} metrics to GA4`);

  } catch (error) {
    console.error('Failed to send to GA4:', error);
  }
}

/**
 * Send to Vercel Analytics
 */
async function sendToVercelAnalytics(metrics: any[]): Promise<void> {
  try {
    // Vercel Analytics Web Vitals integration
    const events = metrics.map(metric => ({
      type: 'web-vital',
      name: metric.metric.name,
      value: metric.metric.value,
      rating: metric.metric.rating,
      route: metric.route,
      timestamp: metric.timestamp
    }));

    // Send to Vercel Analytics endpoint
    await fetch('https://vitals.vercel-analytics.com/v1/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERCEL_ANALYTICS_ID}`
      },
      body: JSON.stringify({ events })
    });

    console.log(`📊 Sent ${metrics.length} metrics to Vercel Analytics`);

  } catch (error) {
    console.error('Failed to send to Vercel Analytics:', error);
  }
}

/**
 * Send to custom analytics endpoint
 */
async function sendToCustomAnalytics(metrics: any[]): Promise<void> {
  try {
    await fetch(process.env.CUSTOM_ANALYTICS_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CUSTOM_ANALYTICS_TOKEN}`
      },
      body: JSON.stringify({
        type: 'web-vitals',
        metrics,
        timestamp: Date.now()
      })
    });

    console.log(`📊 Sent ${metrics.length} metrics to custom analytics`);

  } catch (error) {
    console.error('Failed to send to custom analytics:', error);
  }
}

/**
 * Check for performance alerts
 */
async function checkPerformanceAlerts(metrics: any[]): Promise<void> {
  const criticalMetrics = metrics.filter(metric => 
    metric.metric.rating === 'poor'
  );

  if (criticalMetrics.length === 0) return;

  try {
    // Group by route and metric type
    const alertGroups = criticalMetrics.reduce((groups, metric) => {
      const key = `${metric.route}-${metric.metric.name}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(metric);
      return groups;
    }, {} as Record<string, any[]>);

    // Send alerts for each group
    for (const [key, groupMetrics] of Object.entries(alertGroups)) {
      await sendPerformanceAlert(key, groupMetrics);
    }

  } catch (error) {
    console.error('Failed to send performance alerts:', error);
  }
}

/**
 * Send performance alert
 */
async function sendPerformanceAlert(alertKey: string, metrics: any[]): Promise<void> {
  const firstMetric = metrics[0];
  const avgValue = metrics.reduce((sum, m) => sum + m.metric.value, 0) / metrics.length;

  const alertData = {
    type: 'performance-alert',
    severity: 'high',
    metric: firstMetric.metric.name,
    route: firstMetric.route,
    feature: firstMetric.feature,
    averageValue: avgValue,
    occurrences: metrics.length,
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  };

  // Send to alerting service (Slack, email, PagerDuty, etc.)
  if (process.env.SLACK_WEBHOOK_URL) {
    await sendSlackAlert(alertData);
  }

  if (process.env.ALERT_EMAIL_ENDPOINT) {
    await sendEmailAlert(alertData);
  }

  console.warn(`🚨 Performance alert sent: ${alertKey}`, alertData);
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(alertData: any): Promise<void> {
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: `🚨 Performance Alert: Poor ${alertData.metric} on ${alertData.route}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Performance Alert*\n*Metric:* ${alertData.metric}\n*Route:* ${alertData.route}\n*Average Value:* ${alertData.averageValue.toFixed(2)}\n*Occurrences:* ${alertData.occurrences}`
            }
          }
        ]
      })
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(alertData: any): Promise<void> {
  try {
    await fetch(process.env.ALERT_EMAIL_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALERT_EMAIL_TOKEN}`
      },
      body: JSON.stringify({
        to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
        subject: `Performance Alert: Poor ${alertData.metric} on ${alertData.route}`,
        html: `
          <h2>Performance Alert</h2>
          <p><strong>Metric:</strong> ${alertData.metric}</p>
          <p><strong>Route:</strong> ${alertData.route}</p>
          <p><strong>Feature:</strong> ${alertData.feature}</p>
          <p><strong>Average Value:</strong> ${alertData.averageValue.toFixed(2)}</p>
          <p><strong>Occurrences:</strong> ${alertData.occurrences}</p>
          <p><strong>Environment:</strong> ${alertData.environment}</p>
          <p><strong>Timestamp:</strong> ${new Date(alertData.timestamp).toISOString()}</p>
        `
      })
    });
  } catch (error) {
    console.error('Failed to send email alert:', error);
  }
}
