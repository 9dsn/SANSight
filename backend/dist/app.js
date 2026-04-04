"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("express-async-errors");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const routes_1 = require("./routes");
const logger_1 = require("./utils/logger");
exports.app = (0, express_1.default)();
exports.app.set("trust proxy", 1);
exports.app.use((0, pino_http_1.default)({
    logger: logger_1.logger
}));
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true
}));
exports.app.use((0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    limit: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false
}));
exports.app.use(express_1.default.json({ limit: "1mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)(env_1.env.COOKIE_SECRET));
exports.app.get("/healthz", (_req, res) => {
    res.status(200).json({
        status: "ok"
    });
});
exports.app.use("/api", routes_1.apiRouter);
exports.app.use(notFound_1.notFoundHandler);
exports.app.use(errorHandler_1.errorHandler);
