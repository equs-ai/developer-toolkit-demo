import type { RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config } from '../config.js'
import { AppError } from '../errors.js'

// DTK's machine client lives in the same realm the end users sign in to, so the same JWKS applies.
const jwks = createRemoteJWKSet(new URL(config.extKc.jwksUrl))

export const requireAttributeProviderCaller: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    console.warn('Rejected an Attribute Provider call with no Bearer token')
    next(new AppError('unauthorized', 'A valid access token is required', 401))
    return
  }

  try {
    const { payload } = await jwtVerify(header.slice('Bearer '.length), jwks, {
      issuer: config.extKc.issuer,
      audience: config.attributeProvider.audience,
    })

    if (payload.azp !== config.attributeProvider.clientId) {
      console.warn(`Rejected an Attribute Provider call from client '${String(payload.azp)}'`)
      next(new AppError('forbidden', 'This client may not read customer claims', 403))
      return
    }

    next()
  } catch (err) {
    console.warn(`Rejected an Attribute Provider token: ${err instanceof Error ? err.message : String(err)}`)
    next(new AppError('unauthorized', 'A valid access token is required', 401))
  }
}
