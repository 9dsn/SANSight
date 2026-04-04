/** Authenticated: POST /vision/upload (multipart). */
import { Router } from "express";
import { visionController } from "../controllers/visionController";
import { requireAuth } from "../middleware/auth";
import { uploadVisionImage } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

export const visionRoutes = Router();

visionRoutes.use(requireAuth);
visionRoutes.post("/vision/upload", uploadVisionImage.single("image"), asyncHandler(visionController.upload));
