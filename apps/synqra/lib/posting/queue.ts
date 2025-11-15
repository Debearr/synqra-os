import { config } from './config';
import { routePost } from './router';

interface QueueJob {
  id: string;
  platform: string;
  payload: any;
  jobId: string;
  attempts: number;
}

const queue: QueueJob[] = [];
let isProcessing = false;

export function enqueue(job: Omit<QueueJob, 'id' | 'attempts'>): void {
  const queueJob: QueueJob = {
    ...job,
    id: crypto.randomUUID(),
    attempts: 0,
  };
  queue.push(queueJob);
  console.log(`📥 Enqueued: ${job.platform} for job ${job.jobId}`);
  processQueue();
}

async function processQueue(): Promise<void> {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;

  try {
    const job = queue.shift();
    if (!job) return;

    try {
      await routePost(job.platform, job.payload);
      console.log(`✅ Processed: ${job.platform} for job ${job.jobId}`);
    } catch (error: any) {
      job.attempts++;

      if (job.attempts < config.retryAttempts) {
        const delay = config.retryDelays[job.attempts - 1] || 60000;
        console.log(`⏰ Retry ${job.attempts}/${config.retryAttempts} for ${job.platform} in ${delay}ms`);

        setTimeout(() => {
          queue.unshift(job);
          processQueue();
        }, delay);
      } else {
        console.error(`❌ Failed permanently: ${job.platform} for job ${job.jobId}`, error.message);
      }
    }
  } finally {
    isProcessing = false;
    if (queue.length > 0) {
      setTimeout(processQueue, 1000);
    }
  }
}

export function getQueueSize(): number {
  return queue.length;
}
