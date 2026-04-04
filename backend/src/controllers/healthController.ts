/** Health metrics API; new rows trigger async risk recomputation via BullMQ. */
import { Request, Response } from "express";
import { enqueueRiskRecompute } from "../queue/riskQueue";
import { healthService } from "../services/healthService";

export const healthController = {
  async create(req: Request, res: Response) {
    const userId = req.userId!;
    const metrics = await healthService.create({
      userId,
      ...req.body
    });

    await enqueueRiskRecompute({ userId, trigger: "health" });

    res.status(201).json({
      health_metrics: metrics
    });
  },

  async list(req: Request, res: Response) {
    const userId = req.userId!;
    const limit = Number(req.query.limit ?? 20);
    const metrics = await healthService.listByUser(userId, limit);

    res.status(200).json({
      items: metrics
    });
  }
};
