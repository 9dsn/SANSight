/**
 * Express application factory: security headers, CORS, rate limits, logging, /api mount, error handling.
 * Process entrypoint is server.ts (HTTP listen).
 */
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { apiRouter } from "./routes";
import { logger } from "./utils/logger";

export const app = express();

app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger
  })
);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true
  })
);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
