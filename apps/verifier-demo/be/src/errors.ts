import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class DtkError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly url: string,
    readonly body: unknown
  ) {
    super(`DTK responded ${status} to ${method} ${url}`)
    this.name = 'DtkError'
  }
}

export function fromDtkFailure(err: DtkError): AppError {
  if (err.status === 401 || err.status === 403) {
    return new AppError('dtk_auth_failed', 'This service is not correctly configured to call DTK', 500)
  }

  if (err.status === 404) {
    return new AppError('not_found', 'The requested resource does not exist in DTK', 404)
  }

  if (err.status >= 400 && err.status < 500) {
    return new AppError('dtk_rejected', 'DTK rejected the request', 422)
  }

  return new AppError('dtk_unavailable', 'DTK could not be reached', 502)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof DtkError) {
    console.error(`${err.message}\n  upstream body: ${JSON.stringify(err.body)}`)
    const mapped = fromDtkFailure(err)
    res.status(mapped.status).json({ error: mapped.code, message: mapped.message })
    return
  }

  if (err instanceof AppError) {
    console.error(`${err.code}: ${err.message}`)
    res.status(err.status).json({ error: err.code, message: err.message })
    return
  }

  if (err instanceof ZodError) {
    console.error(`Request validation failed: ${JSON.stringify(err.flatten().fieldErrors)}`)
    res.status(400).json({ error: 'invalid_request', message: 'The request body is not valid' })
    return
  }

  console.error('Unhandled error', err)
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong' })
}
