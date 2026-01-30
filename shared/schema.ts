import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const aqiReadings = pgTable("aqi_readings", {
  id: serial("id").primaryKey(),
  value: integer("value").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAqiSchema = createInsertSchema(aqiReadings).omit({ id: true });

export type AqiReading = typeof aqiReadings.$inferSelect;
export type InsertAqiReading = z.infer<typeof insertAqiSchema>;
