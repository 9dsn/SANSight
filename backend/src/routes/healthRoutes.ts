/** Authenticated: POST/GET /health (nutrition metrics). */
import { Router } from "express";
import { healthController } from "../controllers/healthController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createHealthSchema, listQuerySchema } from "./schemas";

export const healthRoutes = Router();

healthRoutes.use(requireAuth);
healthRoutes.post("/health", validate(createHealthSchema), asyncHandler(healthController.create));
healthRoutes.get("/health", validate(listQuerySchema, "query"), asyncHandler(healthController.list));
