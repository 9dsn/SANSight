"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthService = void 0;
const prisma_1 = require("../db/prisma");
exports.healthService = {
    async create(input) {
        return prisma_1.prisma.healthMetrics.create({
            data: {
                user_id: input.userId,
                sodium: input.sodium,
                vitamin_d: input.vitamin_d,
                calcium: input.calcium,
                magnesium: input.magnesium
            }
        });
    },
    async listByUser(userId, limit = 20) {
        return prisma_1.prisma.healthMetrics.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            take: limit
        });
    },
    async latestByUser(userId) {
        return prisma_1.prisma.healthMetrics.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: "desc" }
        });
    }
};
