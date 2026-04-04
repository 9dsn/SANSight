import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

type CreateVisionDataInput = {
  userId: string;
  imageUrl: string;
  eyeMetrics: Record<string, unknown>;
};

export const visionService = {
  async create(input: CreateVisionDataInput) {
    return prisma.visionData.create({
      data: {
        user_id: input.userId,
        image_url: input.imageUrl,
        eye_metrics: input.eyeMetrics as Prisma.JsonObject
      }
    });
  },

  async latestByUser(userId: string) {
    return prisma.visionData.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    });
  }
};
