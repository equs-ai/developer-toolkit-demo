import { useEffect, useRef, useState } from 'react'

type GuidePanelProps = {
  connectorName: string
  connectorUrl: string
  /** The shop's UCP profile. The shop is not a connector: the prompts tell the assistant where it is */
  shopUcpUrl: string
  /** Where to get the credential the user approves with, if the demo links to one */
  credentialIssuerUrl?: string
  prompts: { title: string; text: string }[]
}

export function GuidePanel({ connectorName, connectorUrl, shopUcpUrl, credentialIssuerUrl, prompts }: GuidePanelProps) {
  return (
    <section className="panel guide">
      <header className="panel-header">
        <div>
          <h2 className="panel-title">Try it yourself</h2>
          <p className="panel-subtitle">The same flow in Claude Code, with your own wallet.</p>
        </div>
      </header>

      <ol className="guide-steps">
        <li>
          <h3>Have a KYC credential</h3>
          <p>
            Your EQUS wallet needs the KYC credential from the demo issuer. You approve each purchase by presenting it.
            {credentialIssuerUrl && (
              <>
                {' '}
                <a href={credentialIssuerUrl} target="_blank" rel="noreferrer">
                  Get it from the demo issuer
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                .
              </>
            )}
          </p>
        </li>

        <li>
          <h3>Add the {connectorName} connector to Claude Code</h3>
          <div className="guide-prompt">
            <span className="guide-prompt-title">From a terminal</span>
            <CopyField value={`claude mcp add --transport http ${toServerName(connectorName)} ${connectorUrl}`} />
            <p>
              Then start Claude Code, run <code>/mcp</code>, pick {toServerName(connectorName)} and sign in with your EQUS account.
            </p>
          </div>
          <div className="guide-prompt">
            <span className="guide-prompt-title">As a Claude custom connector</span>
            <p>
              Add a custom connector as{' '}
              <a href={CUSTOM_CONNECTOR_HELP_URL} target="_blank" rel="noreferrer">
                Claude's guide
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>{' '}
              describes, named {connectorName}, with this URL:
            </p>
            <CopyField value={connectorUrl} />
            <p>
              Choose <strong>Sign in when needed</strong> and <strong>Use Claude's published identity</strong>, then sign in with your EQUS
              account when Claude asks. Claude Code uses it when you are signed in to the same Claude account.
            </p>
          </div>
        </li>

        <li>
          <h3>Ask for something</h3>
          <p>
            Start a new Claude Code session and send one of these. If your connector has a different name, replace {connectorName} in the
            prompts below with it.
          </p>
          <p>
            The prompts include Sneaker Depot's address, <code>{shopUcpUrl}</code>: it is a UCP shop, so Claude Code calls it over HTTP.
          </p>
          {prompts.map((prompt) => (
            <div key={prompt.title} className="guide-prompt">
              <span className="guide-prompt-title">{prompt.title}</span>
              <CopyField value={prompt.text} multiline />
            </div>
          ))}
        </li>

        <li>
          <h3>Approve in your wallet</h3>
          <p>
            Claude Code shows you an approval link: open it, sign in and approve in your wallet, then confirm in Claude Code. It checks the
            approval and finishes the purchase.
          </p>
        </li>
      </ol>
    </section>
  )
}

const CUSTOM_CONNECTOR_HELP_URL = 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp'

// Claude Code server names are one word: "EQUS AP2" becomes "equs-ap2"
const toServerName = (connectorName: string) =>
  connectorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const COPIED_FOR_MS = 1500

function CopyField({ value, multiline = false }: { value: string; multiline?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(reset.current), [])

  const copy = () => {
    // The Clipboard API needs a secure origin; elsewhere the user selects the text by hand
    const done = navigator.clipboard
      ? navigator.clipboard.writeText(value).then(() => 'copied' as const)
      : Promise.resolve('failed' as const)

    void done
      .catch(() => 'failed' as const)
      .then((result) => {
        setState(result)
        clearTimeout(reset.current)
        reset.current = setTimeout(() => setState('idle'), COPIED_FOR_MS)
      })
  }

  return (
    <div className={multiline ? 'copy-field copy-field-multiline' : 'copy-field'}>
      <code>{value}</code>
      <button type="button" className="button button-secondary button-small" onClick={copy}>
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Select and copy' : 'Copy'}
      </button>
    </div>
  )
}
