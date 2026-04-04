"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskService = void 0;
const prisma_1 = require("../db/prisma");
const crypto_1 = require("../utils/crypto");
const httpError_1 = require("../utils/httpError");
const exerciseService_1 = require("./exerciseService");
const healthService_1 = require("./healthService");
const mlService_1 = require("./mlService");
const visionService_1 = require("./visionService");
const MODEL_VERSION = "sans-risk-v1";
const computeExerciseLoad = (logs) => {
    if (!logs.length) {
        return 0;
    }
    const totalLoad = logs.reduce((sum, log) => sum + log.duration_minutes * log.intensity, 0);
    return Number((totalLoad / logs.length).toFixed(2));
};
exports.riskService = {
    async buildPredictionInput(userId) {
        const [health, vision, exerciseLogs] = await Promise.all([
            healthService_1.healthService.latestByUser(userId),
            visionService_1.visionService.latestByUser(userId),
            exerciseService_1.exerciseService.recentByUser(userId)
        ]);
        if (!health) {
            throw new httpError_1.HttpError(400, "Health metrics are required before risk prediction can run");
        }
        return {
            health,
            vision,
            exerciseLogs,
            mlPayload: {
                sodium: health.sodium,
                vitamin_d: health.vitamin_d,
                calcium: health.calcium,
                magnesium: health.magnesium,
                exercise_load: computeExerciseLoad(exerciseLogs),
                eye_metrics: vision?.eye_metrics ?? {}
            }
        };
    },
    async computeAndPersist(userId) {
        const { health, vision, exerciseLogs, mlPayload } = await this.buildPredictionInput(userId);
        const prediction = await mlService_1.mlService.predictRisk(mlPayload);
        const result = await prisma_1.prisma.riskResult.create({
            data: {
                user_id: userId,
                risk_score: prediction.risk_score,
                model_version: MODEL_VERSION,
                input_snapshot: (0, crypto_1.encryptJson)({
                    nutrition: health,
                    latest_vision: vision,
                    exercise_logs: exerciseLogs,
                    disclaimer: "This system predicts SANS risk and does not provide medical diagnosis."
                })
            }
        });
        return {
            result,
            disclaimer: "This system predicts SANS risk and is not a medical diagnosis."
        };
    },
    async latestForUser(userId) {
        return prisma_1.prisma.riskResult.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: "desc" }
        });
    }
};
