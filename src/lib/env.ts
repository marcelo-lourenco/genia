import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  // FamilySearch OAuth2 Settings
  FAMILYSEARCH_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  FAMILYSEARCH_CLIENT_ID: z.string().min(1, "FamilySearch Client ID is required"),
  FAMILYSEARCH_CLIENT_SECRET: z.string().optional(),
  FAMILYSEARCH_REDIRECT_URI: z.string().url().default("http://localhost:3000/api/auth/callback"),
  FAMILYSEARCH_SESSION_ID: z.string().optional(),
  FAMILYSEARCH_USER_NAME: z.string().optional(),

  // Google Gemini Settings
  GEMINI_API_KEY: z.string().min(1, "Gemini API Key is required"),

  // Session Security
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters long")
    .default("default_development_secret_that_is_at_least_32_chars_long!"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment configuration. Check server logs.");
  }
  return parsed.data;
}
