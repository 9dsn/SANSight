/** Structured logging (Pino); pretty output in non-production only. */
import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true }
      }
});
