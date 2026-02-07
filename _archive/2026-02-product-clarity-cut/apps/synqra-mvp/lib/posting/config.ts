export const config = {
  dryRun: process.env.DRY_RUN !== 'false',
  postingEnabled: process.env.POSTING_ENABLED === 'true',
  approvalRequired: process.env.APPROVAL_REQUIRED !== 'false',
  timezone: process.env.DEFAULT_TIMEZONE || 'America/Toronto',
  retryAttempts: 3,
  retryDelays: [10000, 30000, 60000], // 10s, 30s, 1m
};

export function shouldPost(): boolean {
  if (config.dryRun) {
    console.log('🧪 DRY_RUN mode - no actual posting');
    return false;
  }
  if (!config.postingEnabled) {
    console.log('🚫 Posting disabled');
    return false;
  }
  return true;
}
