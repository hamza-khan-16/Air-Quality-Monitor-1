import { db } from "./db";
import { aqiReadings, type InsertAqiReading, type AqiReading } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  getAqiReadings(): Promise<AqiReading[]>;
  createAqiReading(reading: InsertAqiReading): Promise<AqiReading>;
}

export class DatabaseStorage implements IStorage {
  async getAqiReadings(): Promise<AqiReading[]> {
    return await db.select().from(aqiReadings).orderBy(desc(aqiReadings.timestamp)).limit(100);
  }

  async createAqiReading(reading: InsertAqiReading): Promise<AqiReading> {
    const [created] = await db.insert(aqiReadings).values(reading).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
