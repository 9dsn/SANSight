import { prisma } from "../db/prisma";

export const userService = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

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
