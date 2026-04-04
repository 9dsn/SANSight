"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseService = void 0;
const prisma_1 = require("../db/prisma");
const computeSuggestedDefaults = (logs) => {
    if (!logs.length) {
        return null;
    }
    const totalDuration = logs.reduce((sum, log) => sum + log.duration_minutes, 0);
    const totalIntensity = logs.reduce((sum, log) => sum + log.intensity, 0);
    return {
        default_duration: Math.round(totalDuration / logs.length),
        default_intensity: Math.round(totalIntensity / logs.length)
    };
};
exports.exerciseService = {
    async create(input) {
        const log = await prisma_1.prisma.exerciseLog.create({
            data: {
                user_id: input.userId,
                type: input.type,
                duration_minutes: input.duration_minutes,
                intensity: input.intensity
            }
        });
        const recentSameType = await prisma_1.prisma.exerciseLog.findMany({
            where: {
                user_id: input.userId,
                type: input.type
            },
            orderBy: { created_at: "desc" },
            take: 5,
            select: {
                duration_minutes: true,
                intensity: true
            }
        });
        const defaults = computeSuggestedDefaults(recentSameType);
        if (defaults) {
            await prisma_1.prisma.exerciseTemplate.upsert({
                where: {
                    user_id_type: {
                        user_id: input.userId,
                        type: input.type
                    }
                },
                update: defaults,
                create: {
                    user_id: input.userId,
                    type: input.type,
                    ...defaults
                }
            });
        }
        return {
            log,
            suggested_defaults: defaults
        };
    },
    async listByUser(userId, limit = 20) {
        const [logs, templates] = await Promise.all([
            prisma_1.prisma.exerciseLog.findMany({
                where: { user_id: userId },
                orderBy: { created_at: "desc" },
                take: limit
            }),
            prisma_1.prisma.exerciseTemplate.findMany({
                where: { user_id: userId },
                orderBy: { type: "asc" }
            })
        ]);
        return { logs, templates };
    },
    async recentByUser(userId, limit = 10) {
        return prisma_1.prisma.exerciseLog.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            take: limit
        });
    }
};
