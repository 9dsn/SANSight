/** Mounts all /api/* route modules (each sub-router defines its own paths). */
import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { exerciseRoutes } from "./exerciseRoutes";
import { healthRoutes } from "./healthRoutes";
import { riskRoutes } from "./riskRoutes";
import { visionRoutes } from "./visionRoutes";

export const apiRouter = Router();

apiRouter.use(authRoutes);
apiRouter.use(healthRoutes);
apiRouter.use(visionRoutes);
apiRouter.use(exerciseRoutes);
apiRouter.use(riskRoutes);
