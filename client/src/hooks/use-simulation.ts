import { useState, useEffect } from "react";
import { type AqiReading } from "./use-aqi";

// Simulates live data stream when no real sensor is connected
export function useLiveSimulation() {
  const [currentReading, setCurrentReading] = useState<AqiReading | null>(null);

  useEffect(() => {
    // Initial reading
    setCurrentReading({
      id: 0,
      value: 45,
      timestamp: new Date(),
    });

    const interval = setInterval(() => {
      setCurrentReading((prev) => {
        if (!prev) return null;
        
        // Random walk simulation logic
        const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
        let newValue = prev.value + change;
        
        // Clamp values to realistic range
        if (newValue < 0) newValue = 0;
        if (newValue > 500) newValue = 500;
        
        // Occasionally jump to demonstrate status changes
        if (Math.random() > 0.98) {
            newValue = Math.floor(Math.random() * 300); 
        }

        return {
          id: prev.id + 1,
          value: newValue,
          timestamp: new Date(),
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return currentReading;
}
