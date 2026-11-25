import type { RequestHandler, Response } from 'express'
import { AppError } from '../errors.js'

/**
 * The signed-in user's access token, passed through as is. The AP2 connector is the one that
 * verifies it (issuer, audience, tenant) and acts as that user, exactly as it does for an AI
 * assistant the user connected. Checking it here as well would only duplicate that.
 */
export const requireUserToken: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ') || header.length === 'Bearer '.length) {
    next(new AppError('unauthorized', 'Connect the AP2 connector first', 401))
    return
  }

  res.locals.userToken = header.slice('Bearer '.length)
  next()
}

export function userToken(res: Response): string {
  const token = res.locals.userToken as string | undefined

  if (!token) {
    throw new AppError('internal_error', 'Route is missing the requireUserToken middleware', 500)
  }

  return token
}
