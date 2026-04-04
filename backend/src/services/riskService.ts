import { prisma } from "../db/prisma";
import { encryptJson } from "../utils/crypto";
import { HttpError } from "../utils/httpError";
import { exerciseService } from "./exerciseService";
import { healthService } from "./healthService";
import { mlService } from "./mlService";
import { visionService } from "./visionService";

const MODEL_VERSION = "sans-risk-v1";

const computeExerciseLoad = (
  logs: Array<{
    duration_minutes: number;
    intensity: number;
  }>
) => {
  if (!logs.length) {
    return 0;
  }

  const totalLoad = logs.reduce((sum, log) => sum + log.duration_minutes * log.intensity, 0);
  return Number((totalLoad / logs.length).toFixed(2));
};

export const riskService = {
  async buildPredictionInput(userId: string) {
    const [health, vision, exerciseLogs] = await Promise.all([
      healthService.latestByUser(userId),
      visionService.latestByUser(userId),
      exerciseService.recentByUser(userId)
    ]);

    if (!health) {
      throw new HttpError(400, "Health metrics are required before risk prediction can run");
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
        eye_metrics: (vision?.eye_metrics as Record<string, unknown> | null) ?? {}
      }
    };
  },

  async computeAndPersist(userId: string) {
    const { health, vision, exerciseLogs, mlPayload } = await this.buildPredictionInput(userId);
    const prediction = await mlService.predictRisk(mlPayload);

    const result = await prisma.riskResult.create({
      data: {
        user_id: userId,
        risk_score: prediction.risk_score,
        model_version: MODEL_VERSION,
        input_snapshot: encryptJson({
          nutrition: health,
          latest_vision: vision,
          exercise_logs: exerciseLogs,
          disclaimer:
            "This system predicts SANS risk and does not provide medical diagnosis."
        })
      }
    });

    return {
      result,
      disclaimer: "This system predicts SANS risk and is not a medical diagnosis."
    };
  },

  async latestForUser(userId: string) {
    return prisma.riskResult.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    });
  }
};
