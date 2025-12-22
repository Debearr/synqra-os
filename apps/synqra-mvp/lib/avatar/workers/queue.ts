import { Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";
import { AvatarJobPayload } from "../types";

const globalStore = globalThis as unknown as {
  avatarRedis?: Redis;
  avatarQueue?: Queue<AvatarJobPayload>;
  avatarQueueEvents?: QueueEvents;
};

const connection = globalStore.avatarRedis ?? new Redis(process.env.REDIS_URL || "redis://localhost:6379");
if (!globalStore.avatarRedis) {
  globalStore.avatarRedis = connection;
}

export const AVATAR_QUEUE_NAME = "avatar-generate";

export const avatarQueue =
  globalStore.avatarQueue ??
  new Queue<AvatarJobPayload>(AVATAR_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: true,
      backoff: { type: "exponential", delay: 3000 },
    },
  });

export const avatarQueueEvents = globalStore.avatarQueueEvents ?? new QueueEvents(AVATAR_QUEUE_NAME, { connection });

if (!globalStore.avatarQueue) {
  globalStore.avatarQueue = avatarQueue;
  globalStore.avatarQueueEvents = avatarQueueEvents;
}
