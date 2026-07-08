import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1. Connection Pool banayein (Jaise purane server mein tha)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Prisma Pg Adapter set karein
const adapter = new PrismaPg(pool);

// 3. Global instance check taaki hot-reload pe connections excess na hon
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // 👈 Pg Adapter inject karein
    log: ["query", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 4. DB Connection verify function
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database Connected: PostgreSQL (via Prisma Pg-Adapter)");
  } catch (error: any) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};