import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import * as schema from "./schema";

// enableChangeListener: 테이블이 바뀌면 알림이 와서 화면의 목록만 자동으로 다시 조회된다.
const sqliteDb = openDatabaseSync("pebble.db", { enableChangeListener: true });

export const db = drizzle(sqliteDb, { schema });
