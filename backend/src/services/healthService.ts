/** CRUD for nutrition-related metrics (sodium, vitamins, minerals) used in risk modeling. */
import { prisma } from "../db/prisma";

type CreateHealthMetricsInput = {
  userId: string;
  sodium: number;
  vitamin_d: number;
  calcium: number;
  magnesium: number;
};

export const healthService = {
  async create(input: CreateHealthMetricsInput) {
    return prisma.healthMetrics.create({
      data: {
        user_id: input.userId,
        sodium: input.sodium,
        vitamin_d: input.vitamin_d,
        calcium: input.calcium,
        magnesium: input.magnesium
      }
    });
  },

  async listByUser(userId: string, limit = 20) {
    return prisma.healthMetrics.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: limit
    });
  },

  async latestByUser(userId: string) {
    return prisma.healthMetrics.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    });
  }
};
