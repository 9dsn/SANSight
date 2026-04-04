import { Router } from "express";
import { exerciseController } from "../controllers/exerciseController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createExerciseSchema, listQuerySchema } from "./schemas";

export const exerciseRoutes = Router();

exerciseRoutes.use(requireAuth);
exerciseRoutes.post("/exercise", validate(createExerciseSchema), asyncHandler(exerciseController.create));
exerciseRoutes.get("/exercise", validate(listQuerySchema, "query"), asyncHandler(exerciseController.list));
