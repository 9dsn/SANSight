"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskController = void 0;
const riskQueue_1 = require("../queue/riskQueue");
const riskService_1 = require("../services/riskService");
exports.riskController = {
    async predict(req, res) {
        const userId = req.userId;
        const prediction = await riskService_1.riskService.computeAndPersist(userId);
        await (0, riskQueue_1.enqueueRiskRecompute)({ userId, trigger: "manual" });
        res.status(200).json({
            risk_score: prediction.result.risk_score,
            model_version: prediction.result.model_version,
            risk_result_id: prediction.result.id,
            created_at: prediction.result.created_at,
            disclaimer: prediction.disclaimer
        });
    },
    async latest(req, res) {
        const userId = req.userId;
        const latest = await riskService_1.riskService.latestForUser(userId);
        res.status(200).json({
            item: latest
        });
    }
};
