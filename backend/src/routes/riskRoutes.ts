/** Authenticated: sync predict + latest stored result. */
import { Router } from "express";
import { riskController } from "../controllers/riskController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const riskRoutes = Router();

riskRoutes.use(requireAuth);
riskRoutes.post("/predict-risk", asyncHandler(riskController.predict));
riskRoutes.get("/predict-risk/latest", asyncHandler(riskController.latest));
