import { execSync } from "child_process";

/**
 * Global Setup for Playwright E2E Tests
 * Reseeds the database to ensure clean, deterministic data across personas.
 */
async function globalSetup() {
  console.log("\n--- [E2E Global Setup] Seeding Database ---");
  try {
    execSync("npx prisma db seed", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });
    console.log("--- [E2E Global Setup] Database Seeded Successfully ---\n");
  } catch (error) {
    console.error("--- [E2E Global Setup] Failed to seed database:", error);
    throw error;
  }
}

export default globalSetup;
