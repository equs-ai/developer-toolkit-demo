import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const here = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(here, '..')

dotenv.config({ path: resolve(appDir, '.env') })

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3202),
  CORS_ORIGIN: z.string().url(),

  AP2_MCP_URL: z.string().url(),

  SHOP_PUBLIC_URL: z.string().url(),
  TRUSTED_ISSUERS: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((did) => did.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().startsWith('did:web:')).min(1)),
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
  ap2McpUrl: env.AP2_MCP_URL,
  shopPublicUrl: env.SHOP_PUBLIC_URL.replace(/\/$/, ''),
  trustedIssuers: env.TRUSTED_ISSUERS,
} as const
