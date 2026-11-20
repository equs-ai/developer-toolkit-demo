import type { RequestHandler, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config } from '../config.js'
import { AppError } from '../errors.js'

const jwks = createRemoteJWKSet(new URL(config.extKc.jwksUrl))

export interface EndUser {
  sub: string
  email: string
  name: string
}

function unauthorized(): AppError {
  return new AppError('unauthorized', 'A valid access token is required', 401)
}

function firstString(...values: unknown[]): string {
  const found = values.find((value): value is string => typeof value === 'string')
  if (found === undefined) {
    throw new Error('firstString: no string value provided')
  }
  return found
}

export const requireUser: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    console.warn('Rejected a request with no Bearer token')
    next(unauthorized())
    return
  }

  try {
    const { payload } = await jwtVerify(header.slice('Bearer '.length), jwks, {
      issuer: config.extKc.issuer,
      audience: config.extKc.audience,
    })

    const { sub, email, name, preferred_username: preferredUsername } = payload

    if (typeof sub !== 'string' || typeof email !== 'string') {
      console.warn('Rejected a token without both `sub` and `email` claims — check the client scopes in Keycloak')
      next(unauthorized())
      return
    }

    const resolvedName = firstString(name, preferredUsername, email)

    res.locals.user = { sub, email, name: resolvedName } satisfies EndUser
    next()
  } catch (err) {
    console.warn(`Rejected a token: ${err instanceof Error ? err.message : String(err)}`)
    next(unauthorized())
  }
}

export function currentUser(res: Response): EndUser {
  const user = res.locals.user as EndUser | undefined

  if (!user) {
    throw new AppError('internal_error', 'Route is missing the requireUser middleware', 500)
  }

  return user
}
