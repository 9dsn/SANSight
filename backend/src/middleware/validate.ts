import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { HttpError } from "../utils/httpError";

type ValidationTarget = "body" | "query" | "params";

export const validate =
  (schema: AnyZodObject, target: ValidationTarget = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(400, "Validation failed", error.flatten()));
        return;
      }

      next(error);
    }
  };
