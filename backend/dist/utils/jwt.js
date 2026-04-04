"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySessionToken = exports.signSessionToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const EXPIRATION = "7d";
const signSessionToken = (userId) => jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_SECRET, {
    expiresIn: EXPIRATION
});
exports.signSessionToken = signSessionToken;
const verifySessionToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
exports.verifySessionToken = verifySessionToken;
