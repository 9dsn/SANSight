"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptJson = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const env_1 = require("../config/env");
const key = node_crypto_1.default.createHash("sha256").update(env_1.env.ENCRYPTION_KEY).digest();
const encryptJson = (value) => {
    const iv = node_crypto_1.default.randomBytes(12);
    const cipher = node_crypto_1.default.createCipheriv("aes-256-gcm", key, iv);
    const plaintext = Buffer.from(JSON.stringify(value), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        alg: "aes-256-gcm",
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        ciphertext: ciphertext.toString("base64")
    };
};
exports.encryptJson = encryptJson;
