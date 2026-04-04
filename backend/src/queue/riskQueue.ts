import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const RISK_RECOMPUTE_QUEUE = "risk-recompute";

export type RiskRecomputeJob = {
  userId: string;
  trigger: "health" | "vision" | "exercise" | "manual";
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
