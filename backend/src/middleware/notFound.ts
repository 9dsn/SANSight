/** JSON 404 for undefined routes (after all routers). */
import { Request, Response } from "express";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found"
  });
};
