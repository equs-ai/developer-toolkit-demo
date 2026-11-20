import { McpError } from '../errors.js'
import { APP_VERSION } from '../version.js'

/**
 * Just enough of an MCP client to call one tool: JSON-RPC over Streamable HTTP. Any MCP client
 * library does the same; this one is written out so the whole exchange is readable in one file.
 *
 * Each call is `initialize` → `notifications/initialized` → `tools/call`, with the user's bearer
 * token on every request.
 */

const PROTOCOL_VERSION = '2025-06-18'
const CLIENT_INFO = { name: 'dtk-ap2-demo', version: APP_VERSION }

export interface ToolResult {
  /** The tool's text content, as an AI assistant would read it */
  text: string
  isError: boolean
}

interface JsonRpcResponse {
  id?: number
  result?: unknown
  error?: { code: number; message: string }
}

let nextId = 1

export async function callTool(url: string, token: string, name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const { sessionId } = await post(url, token, 'initialize', {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: CLIENT_INFO,
  })

  await post(url, token, 'notifications/initialized', undefined, sessionId)

  const { result } = await post(url, token, 'tools/call', { name, arguments: args }, sessionId)
  const { content = [], isError = false } = result as { content?: { type: string; text?: string }[]; isError?: boolean }

  return {
    text: content
      .map((part) => (part.type === 'text' ? (part.text ?? '') : ''))
      .join('\n')
      .trim(),
    isError,
  }
}

async function post(
  url: string,
  token: string,
  method: string,
  params: Record<string, unknown> | undefined,
  sessionId?: string
): Promise<{ result: unknown; sessionId?: string }> {
  const isNotification = method.startsWith('notifications/')
  const id = isNotification ? undefined : nextId++

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
      'MCP-Protocol-Version': PROTOCOL_VERSION,
      // Sent back only if the server issued one on initialize; a stateless server issues none
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', method, ...(params ? { params } : {}), ...(id === undefined ? {} : { id }) }),
  })

  const raw = await response.text()

  if (!response.ok) {
    throw new McpError(response.status, method, safeJson(raw))
  }

  const nextSessionId = response.headers.get('mcp-session-id') ?? sessionId

  if (isNotification) {
    return { result: undefined, sessionId: nextSessionId }
  }

  const message = response.headers.get('content-type')?.includes('text/event-stream')
    ? fromEventStream(raw, id)
    : (safeJson(raw) as JsonRpcResponse)

  if (!message || message.error) {
    throw new McpError(response.status, method, message?.error ?? raw, true)
  }

  return { result: message.result, sessionId: nextSessionId }
}

/** The JSON-RPC response for `id` among the `data:` lines of a server-sent event stream. */
function fromEventStream(raw: string, id: number | undefined): JsonRpcResponse | undefined {
  return raw
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => safeJson(line.slice('data:'.length).trim()) as JsonRpcResponse)
    .find((message) => message && typeof message === 'object' && message.id === id)
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
