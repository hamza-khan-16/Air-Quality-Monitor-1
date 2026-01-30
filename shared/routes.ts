import { z } from 'zod';
import { insertAqiSchema, aqiReadings } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  aqi: {
    list: {
      method: 'GET' as const,
      path: '/api/aqi',
      responses: {
        200: z.array(z.custom<typeof aqiReadings.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/aqi',
      input: insertAqiSchema,
      responses: {
        201: z.custom<typeof aqiReadings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
