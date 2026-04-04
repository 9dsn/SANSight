"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const httpError_1 = require("../utils/httpError");
const validate = (schema, target = "body") => (req, _res, next) => {
    try {
        req[target] = schema.parse(req[target]);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            next(new httpError_1.HttpError(400, "Validation failed", error.flatten()));
            return;
        }
        next(error);
    }
};
exports.validate = validate;
