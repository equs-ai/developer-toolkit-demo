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

/** The AP2 connector answered with an HTTP error, or with a JSON-RPC error (`rpcError`). */
export class McpError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly body: unknown,
    readonly rpcError = false
  ) {
    super(`AP2 connector ${rpcError ? 'returned a JSON-RPC error' : `responded ${status}`} to ${method}`)
    this.name = 'McpError'
  }
}

export function fromMcpFailure(err: McpError): AppError {
  // The connector verifies the user's token; the frontend tells the user to connect again
  if (err.status === 401 || err.status === 403) {
    return new AppError('unauthorized', 'The AP2 connector did not accept your sign-in', 401)
  }

  if (err.rpcError || (err.status >= 400 && err.status < 500)) {
    return new AppError('bank_rejected', 'The AP2 connector rejected the request', 422)
  }

  return new AppError('bank_unavailable', 'The AP2 connector could not be reached', 502)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof McpError) {
    console.error(`${err.message}\n  upstream body: ${JSON.stringify(err.body)}`)
    const mapped = fromMcpFailure(err)
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
