import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@/platform/auth/auth.table";

/** Tables owned by this module. Changing this file means `pnpm db:generate` in the same PR. */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notes_owner_id_idx").on(table.ownerId)],
);
