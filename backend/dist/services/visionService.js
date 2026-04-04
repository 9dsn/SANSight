"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visionService = void 0;
const prisma_1 = require("../db/prisma");
exports.visionService = {
    async create(input) {
        return prisma_1.prisma.visionData.create({
            data: {
                user_id: input.userId,
                image_url: input.imageUrl,
                eye_metrics: input.eyeMetrics
            }
        });
    },
    async latestByUser(userId) {
        return prisma_1.prisma.visionData.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: "desc" }
        });
    }
};
