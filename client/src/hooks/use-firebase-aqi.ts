import { useState, useEffect } from "react";
import { database, ref, onValue, isFirebaseConfigured } from "@/lib/firebase";
import { type AqiReading } from "./use-aqi";

export interface FirebaseAqiData {
  current: {
    value: number;
    timestamp: number;
  } | null;
  history: Array<{ timestamp: number; value: number }>;
}

export function useFirebaseAqi() {
  const [currentReading, setCurrentReading] = useState<AqiReading | null>(null);
  const [history, setHistory] = useState<Array<{ timestamp: number; value: number }>>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !database) {
      return;
    }

    const currentRef = ref(database, "aqi/current");
    const historyRef = ref(database, "aqi/history");

    const unsubscribeCurrent = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentReading({
          id: 0,
          value: data.value ?? 0,
          timestamp: new Date(data.timestamp ?? Date.now()),
        });
        setIsConnected(true);
      }
    }, (error) => {
      console.error("Firebase current value error:", error);
      setIsConnected(false);
    });

    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray: Array<{ timestamp: number; value: number }> = [];
        Object.entries(data).forEach(([key, value]) => {
          const timestamp = parseInt(key, 10);
          if (!isNaN(timestamp) && typeof value === "number") {
            historyArray.push({ timestamp, value });
          }
        });
        historyArray.sort((a, b) => a.timestamp - b.timestamp);
        setHistory(historyArray);
      }
    });

    return () => {
      unsubscribeCurrent();
      unsubscribeHistory();
    };
  }, []);

  return { currentReading, history, isConnected, isFirebaseConfigured };
}
