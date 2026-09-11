import app from "./app.js";
import { config } from "./config/index.ts";
import { seedTesterAdmin } from "./config/seed.ts";
import { prisma } from "./lib/prisma.ts";
import { connectRedis } from "./lib/redis.ts";

export async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    await connectRedis();
    console.log("Connected to the database successfully.");
    await seedTesterAdmin();
    app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  }
}
