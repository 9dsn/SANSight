"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlService = void 0;
const env_1 = require("../config/env");
const httpError_1 = require("../utils/httpError");
exports.mlService = {
    async predictRisk(payload) {
        const response = await fetch(env_1.env.ML_SERVICE_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const text = await response.text();
            throw new httpError_1.HttpError(502, "ML service request failed", {
                status: response.status,
                body: text
            });
        }
        const data = (await response.json());
        if (typeof data.risk_score !== "number" || Number.isNaN(data.risk_score)) {
            throw new httpError_1.HttpError(502, "ML service returned an invalid risk score", data);
        }
        return {
            risk_score: Math.max(0, Math.min(1, data.risk_score))
        };
    }
};
