"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const httpError_1 = require("../utils/httpError");
const extractBearerToken = (header) => {
    if (!header?.startsWith("Bearer ")) {
        return undefined;
    }
    return header.slice(7);
};
const requireAuth = (req, _res, next) => {
    const token = extractBearerToken(req.headers.authorization) ?? req.signedCookies?.sans_session;
    if (!token) {
        return next(new httpError_1.HttpError(401, "Authentication required"));
    }
    try {
        const payload = (0, jwt_1.verifySessionToken)(token);
        req.userId = payload.sub;
        return next();
    }
    catch (error) {
        return next(new httpError_1.HttpError(401, "Invalid or expired session token", error));
    }
};
exports.requireAuth = requireAuth;
