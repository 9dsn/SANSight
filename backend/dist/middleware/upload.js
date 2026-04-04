"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVisionImage = void 0;
const multer_1 = __importDefault(require("multer"));
const env_1 = require("../config/env");
const httpError_1 = require("../utils/httpError");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
exports.uploadVisionImage = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: env_1.env.MAX_UPLOAD_MB * 1024 * 1024
    },
    fileFilter: (_req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            callback(new httpError_1.HttpError(400, "Only JPEG, PNG, and WEBP images are allowed"));
            return;
        }
        callback(null, true);
    }
});
