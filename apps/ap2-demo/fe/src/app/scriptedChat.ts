import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A chat that plays a script. The assistant's words are written in advance; the calls it makes are
 * real requests. Where the user would type, the script offers predefined replies as buttons.
 */

export type ChatItem =
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'assistant'; text: string }
  | { id: number; kind: 'tool'; server: string; name: string; input: string; status: 'running' | 'done' | 'failed'; output?: string }
  | { id: number; kind: 'error'; text: string }

export interface Reply {
  id: string
  label: string
  /** What the user says by picking it. A reply with `href` opens a page instead and does not answer. */
  say?: string
  href?: string
}

export interface ToolCall {
  /** Who the assistant calls, as the user would see it */
  server: string
  /** The MCP tool, or the HTTP method and path */
  name: string
  /** Exactly what is sent */
  input: Record<string, unknown>
}

export interface Chat {
  user(text: string): void
  say(text: string): Promise<void>
  tool<T>(call: ToolCall, run: () => Promise<T>, describe: (result: T) => string): Promise<T>
  reply(options: Reply[]): Promise<string>
}

export type Scenario = (chat: Chat) => Promise<void>

const THINKING_MS = 450
const TYPING_STEP_MS = 14
const CHARS_PER_STEP = 3

/** Thrown into a script that was restarted or unmounted, so it stops at its next step. */
class Superseded extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Signed tokens are hundreds of characters long; the chat shows their start, the request carries them whole
const MAX_SHOWN_VALUE = 48

const showInput = (input: Record<string, unknown>) =>
  JSON.stringify(
    input,
    (_key, value: unknown) => (typeof value === 'string' && value.length > MAX_SHOWN_VALUE ? `${value.slice(0, MAX_SHOWN_VALUE)}…` : value),
    2
  )

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never
type NewChatItem = WithoutId<ChatItem>

export function useScriptedChat() {
  const [items, setItems] = useState<ChatItem[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runId = useRef(0)
  const nextItemId = useRef(1)
  const answer = useRef<((replyId: string) => void) | null>(null)
  const isMounted = useRef(true)

  const run = useCallback((scenario: Scenario) => {
    const thisRun = ++runId.current

    const assertCurrent = () => {
      if (runId.current !== thisRun || !isMounted.current) throw new Superseded()
    }

    const add = (item: NewChatItem): number => {
      const id = nextItemId.current++
      setItems((current) => [...current, { ...item, id } as ChatItem])
      return id
    }

    const update = (id: number, patch: Partial<ChatItem>) => {
      setItems((current) => current.map((item) => (item.id === id ? ({ ...item, ...patch } as ChatItem) : item)))
    }

    const chat: Chat = {
      user(text) {
        assertCurrent()
        add({ kind: 'user', text })
      },

      async say(text) {
        assertCurrent()
        await sleep(THINKING_MS)
        assertCurrent()

        const id = add({ kind: 'assistant', text: '' })

        for (let shown = CHARS_PER_STEP; shown < text.length + CHARS_PER_STEP; shown += CHARS_PER_STEP) {
          await sleep(TYPING_STEP_MS)
          assertCurrent()
          update(id, { text: text.slice(0, shown) })
        }
      },

      async tool(call, runTool, describe) {
        assertCurrent()

        const id = add({
          kind: 'tool',
          server: call.server,
          name: call.name,
          input: showInput(call.input),
          status: 'running',
        })

        try {
          const result = await runTool()
          assertCurrent()
          update(id, { status: 'done', output: describe(result) })
          return result
        } catch (err) {
          assertCurrent()
          update(id, { status: 'failed', output: err instanceof Error ? err.message : String(err) })
          throw err
        }
      },

      reply(options) {
        assertCurrent()
        setReplies(options)

        return new Promise((resolve) => {
          answer.current = (replyId) => {
            const picked = options.find((option) => option.id === replyId)

            answer.current = null
            setReplies([])

            if (picked?.say) {
              add({ kind: 'user', text: picked.say })
            }

            resolve(replyId)
          }
        })
      },
    }

    answer.current = null
    setItems([])
    setReplies([])
    setIsRunning(true)

    scenario(chat)
      .catch((err: unknown) => {
        if (err instanceof Superseded) return

        add({ kind: 'error', text: err instanceof Error ? err.message : String(err) })
      })
      .finally(() => {
        if (runId.current === thisRun) setIsRunning(false)
      })
  }, [])

  const choose = useCallback((replyId: string) => answer.current?.(replyId), [])

  // A script still running when the chat goes away stops at its next step. A flag rather than a
  // bumped run ID, so StrictMode's unmount-and-remount in development does not stop it.
  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  return { items, replies, isRunning, run, choose }
}
