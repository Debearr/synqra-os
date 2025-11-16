# ⏰ CRON JOBS REFERENCE

**Purpose**: Single source of truth for all scheduled tasks

---

## 📋 ALL CRON JOBS

### 1. Enterprise Health Check

**Schedule**: `*/15 * * * *` (Every 15 minutes)  
**Service**: synqra-mvp  
**Endpoint**: `/api/health/enterprise`  
**Timeout**: 60 seconds  
**Retries**: 2

**Purpose**: Run comprehensive health checks across all services and attempt auto-repair if needed.

**Railway Command**:
```bash
curl -X GET https://synqra.app/api/health/enterprise
```

---

### 2. Waitlist Email Queue Processor

**Schedule**: `*/5 * * * *` (Every 5 minutes)  
**Service**: synqra-mvp  
**Endpoint**: `/api/waitlist/process-queue`  
**Timeout**: 30 seconds  
**Retries**: 3

**Purpose**: Process pending waitlist confirmation emails and update database.

**Railway Command**:
```bash
curl -X POST https://synqra.app/api/waitlist/process-queue
```

---

### 3. Market Intelligence Aggregation

**Schedule**: `0 */6 * * *` (Every 6 hours)  
**Service**: synqra-mvp  
**Endpoint**: `/api/intelligence/aggregate`  
**Timeout**: 120 seconds  
**Retries**: 2

**Purpose**: Aggregate market signals, update lead scores, and refresh intelligence data.

**Railway Command**:
```bash
curl -X POST https://synqra.app/api/intelligence/aggregate
```

---

### 4. Cache Cleanup

**Schedule**: `0 3 * * *` (Daily at 3 AM UTC)  
**Service**: synqra-mvp  
**Endpoint**: `/api/cache/cleanup`  
**Timeout**: 60 seconds  
**Retries**: 1

**Purpose**: Remove expired cache entries and optimize cache performance.

**Railway Command**:
```bash
curl -X POST https://synqra.app/api/cache/cleanup
```

---

### 5. Analytics Rollup

**Schedule**: `0 1 * * *` (Daily at 1 AM UTC)  
**Service**: synqra-mvp  
**Endpoint**: `/api/analytics/rollup`  
**Timeout**: 180 seconds  
**Retries**: 2

**Purpose**: Aggregate daily analytics and performance metrics.

**Railway Command**:
```bash
curl -X POST https://synqra.app/api/analytics/rollup
```

---

### 6. Auto Optimizer

**Schedule**: `0 */12 * * *` (Every 12 hours)  
**Service**: synqra-mvp  
**Endpoint**: `/api/optimize`  
**Timeout**: 60 seconds  
**Retries**: 1

**Purpose**: Run optimization checks and adjust model routing based on performance.

**Railway Command**:
```bash
curl -X POST https://synqra.app/api/optimize
```

---

## 🚂 RAILWAY SETUP (PER JOB)

**Path**: Railway Dashboard → [Service] → Settings → Cron

For each job listed above:

1. **Click "Add Cron Job"**
2. **Name**: Copy from "Purpose" section
3. **Schedule**: Copy cron expression (e.g., `*/15 * * * *`)
4. **Command**: Copy Railway command
5. **Timeout**: Copy timeout value
6. **Enable**: Toggle to ON

---

## 🔍 VALIDATION

### Check for Overlaps

```bash
node -e "
  const { findOverlappingJobs } = require('./config/cron-schedule.ts');
  const overlaps = findOverlappingJobs();
  console.log(overlaps);
"
```

**Expected**: Empty array (no overlaps)

### Validate All Jobs

```bash
node -e "
  const { validateCronJobs } = require('./config/cron-schedule.ts');
  const result = validateCronJobs();
  console.log(result);
"
```

**Expected**: `{ valid: true, errors: [], warnings: [] }`

---

## 📊 MONITORING

### Check Cron Execution

**Path**: Railway Dashboard → [Service] → Logs

Filter by: `cron`

**Expected**: See cron job execution logs every time a job runs.

### Check Endpoint Health

Test each endpoint manually:

```bash
# Health Check
curl https://synqra.app/api/health/enterprise

# Waitlist Queue
curl -X POST https://synqra.app/api/waitlist/process-queue

# Intelligence
curl -X POST https://synqra.app/api/intelligence/aggregate

# Cache Cleanup
curl -X POST https://synqra.app/api/cache/cleanup

# Analytics
curl -X POST https://synqra.app/api/analytics/rollup

# Optimizer
curl -X POST https://synqra.app/api/optimize
```

All should return 200 OK or 202 Accepted.

---

## 🚨 TROUBLESHOOTING

### Cron Job Not Running

**Check**:
1. Job is enabled in Railway UI
2. Schedule is valid (5 parts: minute hour day month weekday)
3. Endpoint returns 200 OK when called manually
4. Timeout is sufficient for job duration

### Cron Job Timing Out

**Symptom**: Job logs show timeout errors

**Fix**:
1. Increase timeout in Railway UI
2. Optimize endpoint to run faster
3. Split job into smaller chunks

### Cron Job Failing

**Symptom**: Job runs but endpoint returns error

**Check**:
1. Endpoint logs for error details
2. Database connection is working
3. Required env vars are set
4. Service has enough memory/CPU

---

## 📈 BEST PRACTICES

### Scheduling

- ✅ Run health checks frequently (every 15 min)
- ✅ Run cleanup tasks during low-traffic hours (3 AM UTC)
- ✅ Stagger analytics jobs to avoid overlaps
- ❌ Don't run heavy jobs during peak hours

### Timeouts

- Quick jobs (< 10s): 30 seconds
- Medium jobs (10-60s): 60 seconds
- Heavy jobs (1-3 min): 120-180 seconds

### Retries

- Critical jobs (health, waitlist): 2-3 retries
- Non-critical jobs (analytics, cleanup): 1 retry
- Idempotent jobs only (safe to retry)

---

**Version**: 1.0  
**Last Updated**: 2025-11-15  
**Owner**: NØID Labs
