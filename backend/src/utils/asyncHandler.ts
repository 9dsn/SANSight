/** Wraps async route handlers so rejected promises reach Express error middleware. */
import { RequestHandler } from "express";

export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
