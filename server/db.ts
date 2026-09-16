import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export const db = drizzle({
  connection: databaseUrl,
  schema,
});