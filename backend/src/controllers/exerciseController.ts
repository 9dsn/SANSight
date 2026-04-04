/** Exercise logging and listing; new logs enqueue background risk recomputation. */
import { Request, Response } from "express";
import { enqueueRiskRecompute } from "../queue/riskQueue";
import { exerciseService } from "../services/exerciseService";

export const exerciseController = {
  async create(req: Request, res: Response) {
    const userId = req.userId!;
    const result = await exerciseService.create({
      userId,
      ...req.body
    });

    await enqueueRiskRecompute({ userId, trigger: "exercise" });

    res.status(201).json(result);
  },

  async list(req: Request, res: Response) {
    const userId = req.userId!;
    const limit = Number(req.query.limit ?? 20);
    const data = await exerciseService.listByUser(userId, limit);

    res.status(200).json(data);
  }
};
