/** Exercise logs and per-type template defaults derived from recent activity. */
import { prisma } from "../db/prisma";

type CreateExerciseInput = {
  userId: string;
  type: string;
  duration_minutes: number;
  intensity: number;
};

const computeSuggestedDefaults = (logs: Array<{ duration_minutes: number; intensity: number }>) => {
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

export const exerciseService = {
  async create(input: CreateExerciseInput) {
    const log = await prisma.exerciseLog.create({
      data: {
        user_id: input.userId,
        type: input.type,
        duration_minutes: input.duration_minutes,
        intensity: input.intensity
      }
    });

    const recentSameType = await prisma.exerciseLog.findMany({
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
      await prisma.exerciseTemplate.upsert({
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

  async listByUser(userId: string, limit = 20) {
    const [logs, templates] = await Promise.all([
      prisma.exerciseLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit
      }),
      prisma.exerciseTemplate.findMany({
        where: { user_id: userId },
        orderBy: { type: "asc" }
      })
    ]);

    return { logs, templates };
  },

  async recentByUser(userId: string, limit = 10) {
    return prisma.exerciseLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: limit
    });
  }
};
