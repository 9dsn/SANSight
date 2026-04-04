import { Request, Response } from "express";
import { enqueueRiskRecompute } from "../queue/riskQueue";
import { riskService } from "../services/riskService";

export const riskController = {
  async predict(req: Request, res: Response) {
    const userId = req.userId!;
    const prediction = await riskService.computeAndPersist(userId);

    await enqueueRiskRecompute({ userId, trigger: "manual" });

    res.status(200).json({
      risk_score: prediction.result.risk_score,
      model_version: prediction.result.model_version,
      risk_result_id: prediction.result.id,
      created_at: prediction.result.created_at,
      disclaimer: prediction.disclaimer
    });
  },

  async latest(req: Request, res: Response) {
    const userId = req.userId!;
    const latest = await riskService.latestForUser(userId);

    res.status(200).json({
      item: latest
    });
  }
};
