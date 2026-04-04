/** Shared Redis connection for BullMQ (maxRetriesPerRequest: null required by BullMQ). */
import IORedis from "ioredis";
import { env } from "../config/env";

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});
