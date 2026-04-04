/** HTTP client for the separate ML inference service (returns normalized risk_score in [0, 1]). */
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export type MlPredictionPayload = {
  sodium: number;
  vitamin_d: number;
  calcium: number;
  magnesium: number;
  exercise_load: number;
  eye_metrics: Record<string, unknown>;
};

export const mlService = {
  async predictRisk(payload: MlPredictionPayload) {
    const response = await fetch(env.ML_SERVICE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new HttpError(502, "ML service request failed", {
        status: response.status,
        body: text
      });
    }

    const data = (await response.json()) as { risk_score?: number };

    if (typeof data.risk_score !== "number" || Number.isNaN(data.risk_score)) {
      throw new HttpError(502, "ML service returned an invalid risk score", data);
    }

    return {
      risk_score: Math.max(0, Math.min(1, data.risk_score))
    };
  }
};
