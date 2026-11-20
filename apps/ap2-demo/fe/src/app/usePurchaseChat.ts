import { useCallback, useEffect } from 'react'
import type { BankSession } from '../integration/bankSignIn'
import { config } from './config'
import { onePurchase } from './onePurchase'
import { useScriptedChat } from './scriptedChat'

// Set while the user is away signing in to the connector, so the chat picks up where it left off
const RESUME_KEY = 'ap2-demo:resume'

const resumeFlag = {
  set: () => sessionStorage.setItem(RESUME_KEY, '1'),
  clear: () => sessionStorage.removeItem(RESUME_KEY),
  /** Reads and clears it */
  take: () => {
    const isSet = sessionStorage.getItem(RESUME_KEY) !== null
    sessionStorage.removeItem(RESUME_KEY)
    return isSet
  },
}

/** The one-purchase chat, and picking it up again after the user connects the connector. */
export function usePurchaseChat({ isConnected, userName, error, connect }: BankSession) {
  const chat = useScriptedChat()
  const { run } = chat

  const start = useCallback(
    (resumed: boolean) =>
      run(
        onePurchase({
          connectorName: config.connectorName,
          isBankConnected: isConnected,
          recipient: userName ?? 'Demo customer',
          resumed,
          connectBank: () => {
            resumeFlag.set()
            connect()
          },
        })
      ),
    [run, isConnected, userName, connect]
  )

  useEffect(() => {
    if (error) resumeFlag.clear()
  }, [error])

  useEffect(() => {
    if (isConnected && resumeFlag.take()) start(true)
  }, [isConnected, start])

  return { ...chat, start: () => start(false) }
}
