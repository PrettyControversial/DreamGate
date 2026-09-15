import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// PostgreSQL can terminate an idle client during maintenance or a database
// restart. Keep that connection-level event from becoming an unhandled Node
// error that takes down the entire application process.
pool.on("error", (error) => {
  console.error("PostgreSQL pool connection error:", error);
});

export const db = drizzle(pool, { schema });