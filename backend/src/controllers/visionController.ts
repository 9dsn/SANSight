import { Request, Response } from "express";
import { enqueueRiskRecompute } from "../queue/riskQueue";
import { HttpError } from "../utils/httpError";
import { storageService } from "../services/storageService";
import { visionService } from "../services/visionService";

const parseEyeMetrics = (rawValue: unknown) => {
  if (!rawValue) {
    return {};
  }

  if (typeof rawValue === "string") {
    return JSON.parse(rawValue) as Record<string, unknown>;
  }

  if (typeof rawValue === "object") {
    return rawValue as Record<string, unknown>;
  }

  throw new HttpError(400, "eye_metrics must be valid JSON");
};

export const visionController = {
  async upload(req: Request, res: Response) {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      throw new HttpError(400, "Image file is required");
    }

    const eyeMetrics = parseEyeMetrics(req.body.eye_metrics);
    const uploaded = await storageService.uploadVisionImage(file, userId);
    const visionData = await visionService.create({
      userId,
      imageUrl: uploaded.url,
      eyeMetrics
    });

    await enqueueRiskRecompute({ userId, trigger: "vision" });

    res.status(201).json({
      vision_data: visionData
    });
  }
};
