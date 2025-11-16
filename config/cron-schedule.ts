/**
 * ============================================================
 * CENTRAL CRON SCHEDULE CONFIGURATION
 * ============================================================
 * Single source of truth for all scheduled tasks
 * 
 * RPRD DNA: Clear, simple, no overlaps
 */

export type CronJob = {
  id: string;
  name: string;
  description: string;
  schedule: string; // Crontab expression
  service: string; // Which Railway service runs this
  endpoint: string; // API endpoint to call
  enabled: boolean;
  timeout: number; // Seconds
  retries: number;
};

/**
 * All scheduled tasks in our system
 */
export const CRON_JOBS: CronJob[] = [
  {
    id: "enterprise-health-check",
    name: "Enterprise Health Check",
    description: "Run comprehensive health checks across all services",
    schedule: "*/15 * * * *", // Every 15 minutes
    service: "synqra-mvp",
    endpoint: "/api/health/enterprise",
    enabled: true,
    timeout: 60,
    retries: 2,
  },

  {
    id: "waitlist-email-queue",
    name: "Waitlist Email Queue Processor",
    description: "Process pending waitlist confirmation emails",
    schedule: "*/5 * * * *", // Every 5 minutes
    service: "synqra-mvp",
    endpoint: "/api/waitlist/process-queue",
    enabled: true,
    timeout: 30,
    retries: 3,
  },

  {
    id: "intelligence-aggregation",
    name: "Market Intelligence Aggregation",
    description: "Aggregate market signals and update lead scores",
    schedule: "0 */6 * * *", // Every 6 hours
    service: "synqra-mvp",
    endpoint: "/api/intelligence/aggregate",
    enabled: true,
    timeout: 120,
    retries: 2,
  },

  {
    id: "cache-cleanup",
    name: "Cache Cleanup",
    description: "Remove expired cache entries",
    schedule: "0 3 * * *", // Daily at 3 AM
    service: "synqra-mvp",
    endpoint: "/api/cache/cleanup",
    enabled: true,
    timeout: 60,
    retries: 1,
  },

  {
    id: "analytics-rollup",
    name: "Analytics Rollup",
    description: "Aggregate daily analytics and performance metrics",
    schedule: "0 1 * * *", // Daily at 1 AM
    service: "synqra-mvp",
    endpoint: "/api/analytics/rollup",
    enabled: true,
    timeout: 180,
    retries: 2,
  },

  {
    id: "auto-optimizer",
    name: "Auto Optimizer",
    description: "Run optimization checks and adjust model routing",
    schedule: "0 */12 * * *", // Every 12 hours
    service: "synqra-mvp",
    endpoint: "/api/optimize",
    enabled: true,
    timeout: 60,
    retries: 1,
  },
];

/**
 * Get cron job by ID
 */
export function getCronJob(id: string): CronJob | undefined {
  return CRON_JOBS.find((job) => job.id === id);
}

/**
 * Get all enabled cron jobs
 */
export function getEnabledCronJobs(): CronJob[] {
  return CRON_JOBS.filter((job) => job.enabled);
}

/**
 * Get cron jobs for a specific service
 */
export function getCronJobsForService(serviceName: string): CronJob[] {
  return CRON_JOBS.filter((job) => job.service === serviceName);
}

/**
 * Validate crontab expression (basic validation)
 */
export function isValidCronExpression(expression: string): boolean {
  // Basic validation: should have 5 parts (minute hour day month weekday)
  const parts = expression.trim().split(/\s+/);
  return parts.length === 5;
}

/**
 * Check for overlapping schedules (same time on same service)
 */
export function findOverlappingJobs(): Array<{
  job1: CronJob;
  job2: CronJob;
  reason: string;
}> {
  const overlaps: Array<{ job1: CronJob; job2: CronJob; reason: string }> = [];

  for (let i = 0; i < CRON_JOBS.length; i++) {
    for (let j = i + 1; j < CRON_JOBS.length; j++) {
      const job1 = CRON_JOBS[i];
      const job2 = CRON_JOBS[j];

      // Check if same schedule on same service
      if (
        job1.service === job2.service &&
        job1.schedule === job2.schedule &&
        job1.enabled &&
        job2.enabled
      ) {
        overlaps.push({
          job1,
          job2,
          reason: "Same schedule on same service",
        });
      }
    }
  }

  return overlaps;
}

/**
 * Validate all cron jobs
 */
export function validateCronJobs(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for invalid cron expressions
  for (const job of CRON_JOBS) {
    if (!isValidCronExpression(job.schedule)) {
      errors.push(`Invalid cron expression for ${job.id}: ${job.schedule}`);
    }
  }

  // Check for overlaps
  const overlaps = findOverlappingJobs();
  if (overlaps.length > 0) {
    for (const overlap of overlaps) {
      warnings.push(
        `Overlapping jobs: ${overlap.job1.id} and ${overlap.job2.id} (${overlap.reason})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
