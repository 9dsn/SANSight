"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: zod_1.z.string().default("info"),
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:3000"),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(32),
    COOKIE_SECRET: zod_1.z.string().min(32),
    ENCRYPTION_KEY: zod_1.z.string().min(32),
    WORLD_ID_APP_ID: zod_1.z.string().min(1),
    WORLD_ID_ACTIONS: zod_1.z.string().min(1),
    ML_SERVICE_URL: zod_1.z.string().url(),
    AWS_REGION: zod_1.z.string().min(1),
    AWS_S3_BUCKET: zod_1.z.string().min(1),
    AWS_ACCESS_KEY_ID: zod_1.z.string().min(1),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().min(1),
    AWS_S3_ENDPOINT: zod_1.z.string().optional().transform((value) => value || undefined),
    S3_PUBLIC_BASE_URL: zod_1.z.string().optional().transform((value) => value || undefined),
    MAX_UPLOAD_MB: zod_1.z.coerce.number().positive().default(10),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(100)
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
}
exports.env = {
    ...parsed.data,
    isProduction: parsed.data.NODE_ENV === "production",
    worldIdActions: parsed.data.WORLD_ID_ACTIONS.split(",").map((value) => value.trim()).filter(Boolean)
};
