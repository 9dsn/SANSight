"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExerciseSchema = exports.listQuerySchema = exports.createHealthSchema = exports.verifyWorldIdSchema = void 0;
const zod_1 = require("zod");
exports.verifyWorldIdSchema = zod_1.z.object({
    payload: zod_1.z.record(zod_1.z.any()),
    action: zod_1.z.string().min(1),
    signal: zod_1.z.string().optional()
});
exports.createHealthSchema = zod_1.z.object({
    sodium: zod_1.z.number().finite().nonnegative(),
    vitamin_d: zod_1.z.number().finite().nonnegative(),
    calcium: zod_1.z.number().finite().nonnegative(),
    magnesium: zod_1.z.number().finite().nonnegative()
});
exports.listQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(100).optional()
});
exports.createExerciseSchema = zod_1.z.object({
    type: zod_1.z.string().min(1).max(50),
    duration_minutes: zod_1.z.number().int().positive().max(1440),
    intensity: zod_1.z.number().int().min(1).max(10)
});
