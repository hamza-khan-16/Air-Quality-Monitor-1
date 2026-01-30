import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type errorSchemas } from "@shared/routes";
import { insertAqiSchema } from "@shared/schema";
import { z } from "zod";

// Types derived from schema
export type AqiReading = z.infer<typeof api.aqi.list.responses[200]>[number];
export type CreateAqiInput = z.infer<typeof insertAqiSchema>;

// === API HOOKS ===

// GET /api/aqi - Get historical data
export function useAqiHistory() {
  return useQuery({
    queryKey: [api.aqi.list.path],
    queryFn: async () => {
      const res = await fetch(api.aqi.list.path);
      if (!res.ok) throw new Error("Failed to fetch AQI history");
      return api.aqi.list.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Refresh history every 10s
  });
}

// POST /api/aqi - Add new reading (mostly for testing/simulation)
export function useCreateAqiReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAqiInput) => {
      const res = await fetch(api.aqi.create.path, {
        method: api.aqi.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create reading");
      }
      
      return api.aqi.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.aqi.list.path] });
    },
  });
}

// === HELPER UTILS ===

export function getAqiStatus(value: number) {
  if (value <= 50) return { label: "Good", color: "text-green-600", bg: "bg-green-500", border: "border-green-200", lightBg: "bg-green-50" };
  if (value <= 100) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-500", border: "border-yellow-200", lightBg: "bg-yellow-50" };
  if (value <= 200) return { label: "Unhealthy", color: "text-orange-600", bg: "bg-orange-500", border: "border-orange-200", lightBg: "bg-orange-50" };
  return { label: "Hazardous", color: "text-red-600", bg: "bg-red-500", border: "border-red-200", lightBg: "bg-red-50" };
}
