import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_APP_ID: z.string().min(1, 'DISCORD_APP_ID is required'),
  DISCORD_PUBLIC_KEY: z.string().min(1, 'DISCORD_PUBLIC_KEY is required'),
  ADMIN_IDS: z.string().default('').transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_DURATION_SEC: z.coerce.number().int().positive().default(15),
});

export type AppEnv = z.infer<typeof envSchema> & {
  ADMIN_IDS: string[];
};

export function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }
  return parsed.data;
}

