import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(resolve(here, '..', 'package.json'), 'utf8')) as { version: string }

export const APP_VERSION = packageJson.version
