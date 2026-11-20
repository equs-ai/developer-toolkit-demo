import { useEffect, useRef } from 'react'
import type { ChatItem, Reply } from '../app/scriptedChat'

type ChatPanelProps = {
  items: ChatItem[]
  replies: Reply[]
  isRunning: boolean
  /** Why connecting the AP2 connector failed, if it did */
  signInError?: string
  onStart: () => void
  onReply: (replyId: string) => void
}

export function ChatPanel({ items, replies, isRunning, signInError, onStart, onReply }: ChatPanelProps) {
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [items, replies])

  const draft = replies.find((reply) => reply.say)?.say

  return (
    <section className="panel chat">
      <header className="panel-header">
        <div>
          <h2 className="panel-title">Watch it</h2>
          <p className="panel-subtitle">
            A scripted assistant. Its words are written in advance; its calls to the AP2 connector are real, and the shop is a stand-in.
          </p>
        </div>
        {items.length > 0 && (
          <button type="button" className="button button-secondary" onClick={onStart}>
            Start over
          </button>
        )}
      </header>

      <div className="chat-log" aria-live="polite">
        {items.length === 0 && !isRunning && (
          <div className="chat-intro">
            <p>An AI assistant buys a pair of sneakers for you. It buys only with an approval you give in your wallet.</p>
            {signInError && <p className="message message-error">Could not connect: {signInError}</p>}
            <button type="button" className="button button-primary" onClick={onStart}>
              Start the demo
            </button>
          </div>
        )}

        {items.map((item) => (
          <ChatEntry key={item.id} item={item} />
        ))}

        <div ref={bottom} />
      </div>

      {replies.length > 0 && (
        <footer className="chat-composer">
          {draft && <div className="chat-draft">{draft}</div>}
          <div className="chat-replies">
            {replies.map((reply) =>
              reply.href ? (
                <a key={reply.id} className="button button-secondary" href={reply.href} target="_blank" rel="noreferrer">
                  {reply.label} <span aria-hidden="true">↗</span>
                  <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              ) : (
                <button key={reply.id} type="button" className="button button-primary" onClick={() => onReply(reply.id)}>
                  {reply.label}
                </button>
              )
            )}
          </div>
        </footer>
      )}
    </section>
  )
}

const TOOL_STATUS = { running: 'Running…', done: 'Done', failed: 'Failed' } as const

function ChatEntry({ item }: { item: ChatItem }) {
  switch (item.kind) {
    case 'user':
      return <div className="message message-user">{item.text}</div>

    case 'assistant':
      return <div className="message message-assistant">{item.text}</div>

    case 'error':
      return <div className="message message-error">{item.text}</div>

    case 'tool':
      return (
        <details className={`tool tool-${item.status}`}>
          <summary>
            <span className="tool-name">{item.name}</span>
            <span className="tool-server">{item.server}</span>
            <span className="tool-status">{TOOL_STATUS[item.status]}</span>
          </summary>
          <div className="tool-body">
            <span className="tool-label">Request</span>
            <pre>{item.input}</pre>
            {item.output !== undefined && (
              <>
                <span className="tool-label">Response</span>
                <pre>{item.output}</pre>
              </>
            )}
          </div>
        </details>
      )
  }
}
