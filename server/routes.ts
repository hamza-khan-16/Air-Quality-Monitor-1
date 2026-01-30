import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // List AQI readings
  app.get(api.aqi.list.path, async (req, res) => {
    const readings = await storage.getAqiReadings();
    res.json(readings);
  });

  // Create AQI reading (Simulating an IoT device pushing data)
  app.post(api.aqi.create.path, async (req, res) => {
    try {
      const input = api.aqi.create.input.parse(req.body);
      const reading = await storage.createAqiReading(input);
      res.status(201).json(reading);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
    }
  });

  // Simulator: Seed some initial data if empty
  const existing = await storage.getAqiReadings();
  if (existing.length === 0) {
    console.log("Seeding initial AQI data...");
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      await storage.createAqiReading({
        value: Math.floor(Math.random() * 150) + 20,
        // timestamps every 15 minutes back
        timestamp: new Date(now - i * 15 * 60 * 1000) 
      });
    }
  }

  return httpServer;
}
