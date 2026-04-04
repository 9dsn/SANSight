import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { redisConnection } from "../queue/connection";
import { RISK_RECOMPUTE_QUEUE, RiskRecomputeJob } from "../queue/riskQueue";
import { riskService } from "../services/riskService";
import { logger } from "../utils/logger";

const worker = new Worker<RiskRecomputeJob>(
  RISK_RECOMPUTE_QUEUE,
  async (job) => {
    logger.info({ jobId: job.id, userId: job.data.userId, trigger: job.data.trigger }, "Processing risk job");
    await riskService.computeAndPersist(job.data.userId);
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Risk job completed");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error }, "Risk job failed");
});

const shutdown = async () => {
  logger.info("Shutting down risk worker");
  await worker.close();
  await prisma.$disconnect();
  await redisConnection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
