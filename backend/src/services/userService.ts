import { prisma } from "../db/prisma";

/** Anonymous users keyed by World ID nullifier hash (no PII stored). */
export const userService = {
  async findOrCreateByNullifier(nullifierHash: string) {
    return prisma.user.upsert({
      where: { nullifier_hash: nullifierHash },
      update: {},
      create: {
        nullifier_hash: nullifierHash
      }
    });
  }
};
