"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("../config/env");
const s3 = new client_s3_1.S3Client({
    region: env_1.env.AWS_REGION,
    endpoint: env_1.env.AWS_S3_ENDPOINT,
    forcePathStyle: Boolean(env_1.env.AWS_S3_ENDPOINT),
    credentials: {
        accessKeyId: env_1.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY
    }
});
const buildPublicUrl = (key) => {
    if (env_1.env.S3_PUBLIC_BASE_URL) {
        return `${env_1.env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    }
    return `https://${env_1.env.AWS_S3_BUCKET}.s3.${env_1.env.AWS_REGION}.amazonaws.com/${key}`;
};
exports.storageService = {
    async uploadVisionImage(file, userId) {
        const extension = node_path_1.default.extname(file.originalname) || ".bin";
        const key = `vision/${userId}/${(0, node_crypto_1.randomUUID)()}${extension.toLowerCase()}`;
        await s3.send(new client_s3_1.PutObjectCommand({
            Bucket: env_1.env.AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
        return {
            key,
            url: buildPublicUrl(key)
        };
    }
};
