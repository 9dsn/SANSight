/** BullMQ queue for deferred risk recomputation after health/vision/exercise writes. */
import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const RISK_RECOMPUTE_QUEUE = "risk-recompute";

export type RiskRecomputeJob = {
  userId: string;
  /** Which user data change caused the recompute (for logs/metrics). */
  trigger: "health" | "vision" | "exercise";
};

export const riskQueue = new Queue<RiskRecomputeJob>(RISK_RECOMPUTE_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000
    }
  }
});

export const enqueueRiskRecompute = async (job: RiskRecomputeJob) => {
  await riskQueue.add("recompute", job, {
    jobId: `${job.userId}:${job.trigger}:${Date.now()}`
  });
};
