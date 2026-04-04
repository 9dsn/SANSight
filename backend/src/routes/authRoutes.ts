import { Router } from "express";
import { authController } from "../controllers/authController";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { verifyWorldIdSchema } from "./schemas";

export const authRoutes = Router();

authRoutes.post("/verify-world-id", validate(verifyWorldIdSchema), asyncHandler(authController.verifyWorldId));
