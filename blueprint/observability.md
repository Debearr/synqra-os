# 📊 Observability & Monitoring

**Version**: 1.0.0  
**Philosophy**: "You can't improve what you don't measure"  
**Status**: Production Standard

---

## 🎯 Observability Pillars

### 1. Logging
- What happened
- When it happened
- Why it happened

### 2. Metrics
- How fast
- How often
- How much

### 3. Tracing
- Where in the flow
- Dependencies
- Bottlenecks

---

## 📝 Logging Standards

### Log Levels

```typescript
export enum LogLevel {
  ERROR = 'error',   // System failures, requires immediate action
  WARN = 'warn',     // Degraded performance, potential issues
  INFO = 'info',     // Normal operations, state changes
  DEBUG = 'debug',   // Detailed flow for troubleshooting
}
```

### Structured Logging Format

```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601
  level: LogLevel;
  event: string;            // Event name (e.g., 'ai_inference')
  app: string;              // 'synqra', 'noid', 'aurafx'
  environment: string;      // 'development', 'staging', 'production'
  data: Record<string, any>; // Event-specific data
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// Example
logger.info({
  event: 'ai_inference_complete',
  app: 'synqra',
  environment: 'production',
  data: {
    model: 'deepseek',
    input_tokens: 150,
    output_tokens: 300,
    latency_ms: 1234,
    cost_usd: 0.0001,
    cache_hit: false,
    route_decision: 'local',
  },
  timestamp: new Date().toISOString()
});
```

### Logger Implementation

```typescript
// packages/utils/src/logger.ts

export class Logger {
  constructor(
    private app: string,
    private environment: string
  ) {}
  
  private log(level: LogLevel, event: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      app: this.app,
      environment: this.environment,
      data: data || {},
    };
    
    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }
    
    // Console output (captured by Railway/Vercel)
    console.log(JSON.stringify(entry));
    
    // Optional: Send to external service
    if (this.environment === 'production') {
      this.sendToMonitoring(entry);
    }
  }
  
  error(event: string, data?: any, error?: Error) {
    this.log(LogLevel.ERROR, event, data, error);
  }
  
  warn(event: string, data?: any) {
    this.log(LogLevel.WARN, event, data);
  }
  
  info(event: string, data?: any) {
    this.log(LogLevel.INFO, event, data);
  }
  
  debug(event: string, data?: any) {
    if (this.environment === 'development') {
      this.log(LogLevel.DEBUG, event, data);
    }
  }
}

// Usage
const logger = new Logger('synqra', process.env.NODE_ENV || 'development');
logger.info('user_signup', { email: user.email, plan: 'free' });
```

---

## 📈 Metrics Tracking

### Key Metrics Categories

#### 1. Business Metrics
```typescript
interface BusinessMetrics {
  // User metrics
  signups_total: number;
  signups_today: number;
  active_users_daily: number;
  active_users_monthly: number;
  
  // Content metrics
  content_generated_total: number;
  content_generated_today: number;
  posts_published_total: number;
  posts_published_today: number;
  
  // Revenue metrics
  mrr: number;  // Monthly Recurring Revenue
  arr: number;  // Annual Recurring Revenue
  churn_rate: number;
}
```

#### 2. Technical Metrics
```typescript
interface TechnicalMetrics {
  // Performance
  api_latency_p50: number;  // Median
  api_latency_p95: number;  // 95th percentile
  api_latency_p99: number;  // 99th percentile
  
  // Reliability
  error_rate: number;       // Errors / Total requests
  uptime: number;           // Percentage
  
  // Infrastructure
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  
  // Caching
  cache_hit_rate: number;   // Cache hits / Total requests
}
```

#### 3. AI Metrics
```typescript
interface AIMetrics {
  // Usage
  inferences_total: number;
  inferences_local: number;      // DeepSeek
  inferences_external: number;   // Claude/GPT
  
  // Performance
  inference_latency_local_p95: number;
  inference_latency_external_p95: number;
  
  // Cost
  cost_per_inference_avg: number;
  daily_ai_cost: number;
  monthly_ai_cost: number;
  
  // Quality
  hallucination_rate: number;
  brand_alignment_avg: number;
  safety_violation_rate: number;
  
  // Model health
  model_failure_rate: number;
  fallback_usage_rate: number;
}
```

### Metrics Collection

```typescript
// packages/utils/src/metrics.ts

export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  // Counter: Increment only (e.g., total requests)
  increment(metric: string, value: number = 1) {
    const current = this.counters.get(metric) || 0;
    this.counters.set(metric, current + value);
  }
  
  // Gauge: Set to specific value (e.g., active users)
  set(metric: string, value: number) {
    this.gauges.set(metric, value);
  }
  
  // Histogram: Track distribution (e.g., latencies)
  observe(metric: string, value: number) {
    const values = this.histograms.get(metric) || [];
    values.push(value);
    this.histograms.set(metric, values);
  }
  
  // Calculate percentiles
  percentile(metric: string, p: number): number {
    const values = this.histograms.get(metric) || [];
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  // Flush to database
  async flush() {
    // Store in Supabase
    await supabase.from('metrics').insert({
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: this.computeHistogramStats(),
      timestamp: new Date().toISOString()
    });
    
    // Clear after flush
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// Usage
const metrics = new MetricsCollector();

// Track API request
const start = Date.now();
await handleRequest();
const latency = Date.now() - start;

metrics.increment('api_requests_total');
metrics.observe('api_latency_ms', latency);

// Flush every 60 seconds
setInterval(() => metrics.flush(), 60000);
```

---

## 💰 Cost Tracking

### AI Cost Monitoring

```typescript
interface AICostEntry {
  timestamp: string;
  app: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cache_hit: boolean;
  route_decision: 'local' | 'external';
}

async function trackAICost(entry: AICostEntry) {
  // Log to database
  await supabase.from('ai_costs').insert(entry);
  
  // Update running totals
  metrics.increment('ai_cost_total_usd', entry.cost_usd);
  
  // Alert if exceeding budget
  const dailyCost = await getDailyCost();
  if (dailyCost > DAILY_BUDGET) {
    await sendAlert({
      type: 'cost_exceeded',
      message: `AI cost exceeded daily budget: $${dailyCost.toFixed(2)}`,
      severity: 'high'
    });
  }
}

// Cost calculation
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = {
    'deepseek': { input: 0, output: 0 },  // Free (local)
    'claude-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
  };
  
  const rates = pricing[model] || { input: 0, output: 0 };
  return (inputTokens * rates.input) + (outputTokens * rates.output);
}
```

### Cost Dashboard Query

```sql
-- Daily AI cost by model
SELECT 
  DATE(timestamp) as date,
  model,
  SUM(cost_usd) as total_cost,
  COUNT(*) as inference_count,
  AVG(cost_usd) as avg_cost_per_inference
FROM ai_costs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), model
ORDER BY date DESC, total_cost DESC;

-- Cost efficiency (cache hit rate impact)
SELECT 
  cache_hit,
  COUNT(*) as requests,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost
FROM ai_costs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY cache_hit;
```

---

## 🚨 Alerting

### Alert Types

```typescript
enum AlertSeverity {
  LOW = 'low',       // Informational
  MEDIUM = 'medium', // Investigate soon
  HIGH = 'high',     // Investigate now
  CRITICAL = 'critical' // Wake someone up
}

interface Alert {
  severity: AlertSeverity;
  type: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}
```

### Alert Conditions

```typescript
// 1. Error Rate Too High
if (errorRate > 0.05) {  // 5%
  sendAlert({
    severity: AlertSeverity.HIGH,
    type: 'high_error_rate',
    message: `Error rate at ${(errorRate * 100).toFixed(2)}%`,
    data: { errorRate, threshold: 0.05 }
  });
}

// 2. API Latency Degraded
if (latencyP95 > 1000) {  // 1 second
  sendAlert({
    severity: AlertSeverity.MEDIUM,
    type: 'high_latency',
    message: `API p95 latency at ${latencyP95}ms`,
    data: { latencyP95, threshold: 1000 }
  });
}

// 3. AI Cost Exceeded
if (dailyAICost > DAILY_BUDGET) {
  sendAlert({
    severity: AlertSeverity.HIGH,
    type: 'cost_exceeded',
    message: `AI cost $${dailyAICost.toFixed(2)} exceeds budget $${DAILY_BUDGET}`,
    data: { dailyAICost, budget: DAILY_BUDGET }
  });
}

// 4. Model Failure Rate High
if (modelFailureRate > 0.10) {  // 10%
  sendAlert({
    severity: AlertSeverity.CRITICAL,
    type: 'model_failures',
    message: `Model failure rate at ${(modelFailureRate * 100).toFixed(2)}%`,
    data: { modelFailureRate, model: 'deepseek' }
  });
}

// 5. Cache Hit Rate Low
if (cacheHitRate < 0.40) {  // 40%
  sendAlert({
    severity: AlertSeverity.LOW,
    type: 'low_cache_efficiency',
    message: `Cache hit rate at ${(cacheHitRate * 100).toFixed(2)}%`,
    data: { cacheHitRate, threshold: 0.40 }
  });
}
```

### Alert Delivery

```typescript
async function sendAlert(alert: Alert) {
  // Log to database
  await supabase.from('alerts').insert(alert);
  
  // Send to appropriate channels based on severity
  switch (alert.severity) {
    case AlertSeverity.CRITICAL:
      await sendTelegram(alert);  // Telegram bot
      await sendEmail(alert);     // Email
      await sendSMS(alert);       // SMS (if configured)
      break;
      
    case AlertSeverity.HIGH:
      await sendTelegram(alert);
      await sendEmail(alert);
      break;
      
    case AlertSeverity.MEDIUM:
      await sendTelegram(alert);
      break;
      
    case AlertSeverity.LOW:
      // Just log, no notification
      logger.info('alert_triggered', alert);
      break;
  }
}
```

---

## 📊 Dashboards

### Recommended Views

#### 1. Executive Dashboard
- Daily/Monthly revenue
- User growth
- Content generated
- System uptime

#### 2. Technical Dashboard
- API latency (p50, p95, p99)
- Error rate
- Cache hit rate
- Infrastructure usage

#### 3. AI Dashboard
- Cost per day/month
- Model usage distribution
- Inference latency by model
- Quality metrics (brand alignment, safety)

#### 4. Security Dashboard
- Failed auth attempts
- Rate limit violations
- Safety violations
- Unusual activity patterns

### Implementation (Supabase Dashboard)

```sql
-- Create materialized view for daily metrics
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) FILTER (WHERE event = 'user_signup') as signups,
  COUNT(*) FILTER (WHERE event = 'content_generated') as content_count,
  COUNT(*) FILTER (WHERE event = 'post_published') as posts_published,
  AVG((data->>'latency_ms')::int) as avg_latency,
  SUM((data->>'cost_usd')::float) as total_ai_cost
FROM logs
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY DATE(timestamp);

-- Refresh daily
REFRESH MATERIALIZED VIEW daily_metrics;
```

---

## ✅ Observability Checklist

For every new feature:

- [ ] Structured logging added
- [ ] Key metrics tracked
- [ ] Costs logged (if applicable)
- [ ] Error handling with proper logging
- [ ] Performance benchmarked
- [ ] Alerts configured (if critical)
- [ ] Dashboard updated

---

**Next**: See [security.md](./security.md) for security standards.
