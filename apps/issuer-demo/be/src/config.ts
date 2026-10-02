import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const here = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(here, '..')

dotenv.config({ path: resolve(appDir, '.env') })

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3200),
  CORS_ORIGIN: z.string().url(),

  CONTROL_API_URL: z.string().url(),
  INTEGRATION_API_URL: z.string().url(),

  API_AUTH_TOKEN_URL: z.string().url(),
  API_AUTH_CLIENT_ID: z.string().min(1),
  API_AUTH_CLIENT_SECRET: z.string().min(1),

  EXT_KC_JWKS_URL: z.string().url(),
  EXT_KC_ISSUER: z.string().url(),
  EXT_KC_AUDIENCE: z.string().min(1),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const problems = Object.entries(parsed.error.flatten().fieldErrors).map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
  console.error(`Invalid environment. Copy .env.example to .env and fill it in.\n${problems.join('\n')}`)
  process.exit(1)
}

const env = parsed.data

export const config = {
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  controlApiUrl: env.CONTROL_API_URL,
  integrationApiUrl: env.INTEGRATION_API_URL,
  auth: {
    tokenUrl: env.API_AUTH_TOKEN_URL,
    clientId: env.API_AUTH_CLIENT_ID,
    clientSecret: env.API_AUTH_CLIENT_SECRET,
  },
  extKc: {
    jwksUrl: env.EXT_KC_JWKS_URL,
    issuer: env.EXT_KC_ISSUER,
    audience: env.EXT_KC_AUDIENCE,
  },
} as const
