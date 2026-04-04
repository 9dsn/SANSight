"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueRiskRecompute = exports.riskQueue = exports.RISK_RECOMPUTE_QUEUE = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
exports.RISK_RECOMPUTE_QUEUE = "risk-recompute";
exports.riskQueue = new bullmq_1.Queue(exports.RISK_RECOMPUTE_QUEUE, {
    connection: connection_1.redisConnection,
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
const enqueueRiskRecompute = async (job) => {
    await exports.riskQueue.add("recompute", job, {
        jobId: `${job.userId}:${job.trigger}:${Date.now()}`
    });
};
exports.enqueueRiskRecompute = enqueueRiskRecompute;
