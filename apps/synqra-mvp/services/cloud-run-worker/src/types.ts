export type BackgroundJobRun = {
  id: string;
  user_id: string;
  job_type: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  payload: Record<string, unknown>;
  scheduled_time: string;
  started_at: string | null;
  completed_at: string | null;
  error_log: string | null;
  retry_count: number;
  next_retry_at: string | null;
  idempotency_key: string;
  metadata: Record<string, unknown>;
};

