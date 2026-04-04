"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const env_1 = require("../config/env");
const userService_1 = require("../services/userService");
const worldIdService_1 = require("../services/worldIdService");
const jwt_1 = require("../utils/jwt");
exports.authController = {
    async verifyWorldId(req, res) {
        const { payload, action, signal } = req.body;
        const { nullifierHash, verification } = await worldIdService_1.worldIdService.verifyProof(payload, action, signal);
        const user = await userService_1.userService.findOrCreateByNullifier(nullifierHash);
        const token = (0, jwt_1.signSessionToken)(user.id);
        res.cookie("sans_session", token, {
            httpOnly: true,
            secure: env_1.env.isProduction,
            sameSite: "lax",
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            token,
            user: {
                id: user.id
            },
            verification
        });
    }
};
