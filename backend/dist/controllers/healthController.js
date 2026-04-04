"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const riskQueue_1 = require("../queue/riskQueue");
const healthService_1 = require("../services/healthService");
exports.healthController = {
    async create(req, res) {
        const userId = req.userId;
        const metrics = await healthService_1.healthService.create({
            userId,
            ...req.body
        });
        await (0, riskQueue_1.enqueueRiskRecompute)({ userId, trigger: "health" });
        res.status(201).json({
            health_metrics: metrics
        });
    },
    async list(req, res) {
        const userId = req.userId;
        const limit = Number(req.query.limit ?? 20);
        const metrics = await healthService_1.healthService.listByUser(userId, limit);
        res.status(200).json({
            items: metrics
        });
    }
};
