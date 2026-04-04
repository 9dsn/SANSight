"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worldIdService = void 0;
const backend_1 = require("@worldcoin/idkit-core/backend");
const env_1 = require("../config/env");
const httpError_1 = require("../utils/httpError");
exports.worldIdService = {
    async verifyProof(payload, action, signal) {
        if (!env_1.env.worldIdActions.includes(action)) {
            throw new httpError_1.HttpError(400, "Unsupported World ID action");
        }
        const verification = await (0, backend_1.verifyCloudProof)(payload, env_1.env.WORLD_ID_APP_ID, action, signal);
        if (!verification.success) {
            throw new httpError_1.HttpError(401, "World ID proof verification failed", verification);
        }
        const nullifierHash = payload.nullifier_hash;
        if (!nullifierHash) {
            throw new httpError_1.HttpError(400, "World ID verification response did not include a nullifier hash");
        }
        return {
            nullifierHash,
            verification
        };
    }
};
