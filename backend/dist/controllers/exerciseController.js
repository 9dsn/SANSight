"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseController = void 0;
const riskQueue_1 = require("../queue/riskQueue");
const exerciseService_1 = require("../services/exerciseService");
exports.exerciseController = {
    async create(req, res) {
        const userId = req.userId;
        const result = await exerciseService_1.exerciseService.create({
            userId,
            ...req.body
        });
        await (0, riskQueue_1.enqueueRiskRecompute)({ userId, trigger: "exercise" });
        res.status(201).json(result);
    },
    async list(req, res) {
        const userId = req.userId;
        const limit = Number(req.query.limit ?? 20);
        const data = await exerciseService_1.exerciseService.listByUser(userId, limit);
        res.status(200).json(data);
    }
};
