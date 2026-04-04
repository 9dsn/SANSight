"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visionController = void 0;
const riskQueue_1 = require("../queue/riskQueue");
const httpError_1 = require("../utils/httpError");
const storageService_1 = require("../services/storageService");
const visionService_1 = require("../services/visionService");
const parseEyeMetrics = (rawValue) => {
    if (!rawValue) {
        return {};
    }
    if (typeof rawValue === "string") {
        return JSON.parse(rawValue);
    }
    if (typeof rawValue === "object") {
        return rawValue;
    }
    throw new httpError_1.HttpError(400, "eye_metrics must be valid JSON");
};
exports.visionController = {
    async upload(req, res) {
        const userId = req.userId;
        const file = req.file;
        if (!file) {
            throw new httpError_1.HttpError(400, "Image file is required");
        }
        const eyeMetrics = parseEyeMetrics(req.body.eye_metrics);
        const uploaded = await storageService_1.storageService.uploadVisionImage(file, userId);
        const visionData = await visionService_1.visionService.create({
            userId,
            imageUrl: uploaded.url,
            eyeMetrics
        });
        await (0, riskQueue_1.enqueueRiskRecompute)({ userId, trigger: "vision" });
        res.status(201).json({
            vision_data: visionData
        });
    }
};
