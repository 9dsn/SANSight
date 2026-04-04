"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = require("../db/prisma");
exports.userService = {
    async findById(id) {
        return prisma_1.prisma.user.findUnique({ where: { id } });
    },
    async findOrCreateByNullifier(nullifierHash) {
        return prisma_1.prisma.user.upsert({
            where: { nullifier_hash: nullifierHash },
            update: {},
            create: {
                nullifier_hash: nullifierHash
            }
        });
    }
};
