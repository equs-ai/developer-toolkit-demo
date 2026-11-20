# AP2 frontend — the agent payments page

One page in two halves. On the left, **Watch it**: a scripted chat plays an AI assistant buying a
pair of sneakers with an approval the user gives in their wallet. On the right, **Try it yourself**:
a guide to doing the same in Claude. See [`docs/ap2-flow.md`](../../../docs/ap2-flow.md).

## What is where

```
src/
├── main.tsx        mounts App inside the sign-in provider
├── App.tsx         composition: the connector session, the chat and the guide
├── integration/    ← every line of DTK code
├── app/            this demo's own wiring, and the script the chat plays
└── ui/             presentation only
```

`app/` holds `config.ts` (the `VITE_*` env vars as one typed object), `backendApi.ts` (the calls to
this demo's backend), `types.ts`, `scriptedChat.ts` (the chat engine), `onePurchase.ts` (the script),
`usePurchaseChat.ts` (starting it, and picking it up after sign-in) and `prompts.ts` (what the guide
suggests sending).

`ui/` takes plain data and plain handlers as props and imports nothing from `integration/`.

## The integration

| File                        | What it does                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `integration/bankSignIn.ts` | Connecting the AP2 connector: sign-in to DTK through the Tenant's own IdP |

The user signs in to DTK's users realm with `kc_idp_hint` set to the Tenant's slug, so they land
on the Tenant's own login page. It is the same login an AI assistant takes the user through when they
add the connector, and the access token is what the connector accepts as that user.

Unlike the issuer demo, signing in is not needed to see the page: the guide is for anyone, and the
chat asks to connect when it first needs an approval.

## The script

`scriptedChat.ts` runs a script as an ordinary async function over four steps: the assistant says
something (typed out), the user says something, a call runs, or the script waits for the user to pick
one of a few predefined replies. The words are fixed; the calls are real requests, shown exactly as
sent, and what the assistant says next is filled in from their results. Calls to the connector are MCP
tool calls on the AP2 connector; calls to the shop are UCP over HTTP.

`onePurchase.ts` is the only script so far. Signing in leaves the page; on return the chat starts
over with the request already sent.

## Reading order

`app/config.ts` → `integration/bankSignIn.ts` → `app/onePurchase.ts` → `app/backendApi.ts` →
[`../be/README.md`](../be/README.md).
