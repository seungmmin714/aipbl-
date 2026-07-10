import { PrismaClient } from "@prisma/client";

// Next.js dev 핫리로드 시 PrismaClient가 중복 생성되지 않도록 전역 캐싱
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
