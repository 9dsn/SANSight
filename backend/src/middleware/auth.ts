/** JWT from Authorization: Bearer or signed sans_session cookie; sets req.userId. */
import { NextFunction, Request, Response } from "express";
import { verifySessionToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";

const extractBearerToken = (header?: string) => {
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice(7);
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization) ?? req.signedCookies?.sans_session;

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const payload = verifySessionToken(token);
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return next(new HttpError(401, "Invalid or expired session token", error));
  }
};
