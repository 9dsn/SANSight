"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const prisma_1 = require("../db/prisma");
const connection_1 = require("../queue/connection");
const riskQueue_1 = require("../queue/riskQueue");
const riskService_1 = require("../services/riskService");
const logger_1 = require("../utils/logger");
const worker = new bullmq_1.Worker(riskQueue_1.RISK_RECOMPUTE_QUEUE, async (job) => {
    logger_1.logger.info({ jobId: job.id, userId: job.data.userId, trigger: job.data.trigger }, "Processing risk job");
    await riskService_1.riskService.computeAndPersist(job.data.userId);
}, {
    connection: connection_1.redisConnection,
    concurrency: 5
});
worker.on("completed", (job) => {
    logger_1.logger.info({ jobId: job.id }, "Risk job completed");
});
worker.on("failed", (job, error) => {
    logger_1.logger.error({ jobId: job?.id, error }, "Risk job failed");
});
const shutdown = async () => {
    logger_1.logger.info("Shutting down risk worker");
    await worker.close();
    await prisma_1.prisma.$disconnect();
    await connection_1.redisConnection.quit();
    process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
