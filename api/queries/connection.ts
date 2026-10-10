import { drizzle } from "drizzle-orm/d1";
import * as schema from "@db/schema";
import { getBindings } from "../lib/env";

type Db = ReturnType<typeof drizzle<typeof schema>>;
let instance: Db | undefined;

export function getDb(): Db {
  if (!instance) {
    instance = drizzle(getBindings().DB, { schema });
  }
  return instance;
}
