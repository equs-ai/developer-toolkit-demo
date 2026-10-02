# Issuer frontend — Acme Bank

A customer signs in with the bank's identity provider and receives a KYC credential in their wallet:
either explicitly, by picking a wallet in the Embed UI, or automatically, pushed to their EQUS
wallet.

## What is where

```
src/
├── main.tsx        AuthProvider → AuthHandler → App
├── App.tsx         composition: wires integration/ and app/ calls into ui/ as props
├── integration/    ← every line of DTK code
├── app/            this demo's own wiring
└── ui/             presentation only
```

`app/` is the part a tenant already has in some form: `config.ts` reads the `VITE_*` env vars into
one typed object, `auth.ts` and `AuthHandler.tsx` hold the end-user session against the tenant's
external Keycloak (BYOIdP), `backendApi.ts` calls this demo's own backend with the user's token
attached, and `types.ts` carries the shapes they exchange.

`ui/` is the bank's website — layout, dashboard, styles, icons. It takes plain data and plain
handlers as props and imports nothing from `integration/`. The flow state for the two buttons lives
in `ui/ActionPanel.tsx`, next to the copy that renders it.

If you are reading this repo to learn the integration, `src/integration/` and
[`../be/README.md`](../be/README.md) are the whole story on the issuer side.

## The integration

| File                              | What it does                                               |
| --------------------------------- | ---------------------------------------------------------- |
| `integration/useEmbeddedUi.ts`    | The single `initEmbeddedUi()` / `cleanUpEmbeddedUi()` pair |
| `integration/issueToAnyWallet.ts` | Flow A — "Issue KYC VC to any Wallet", via `issueVC()`     |

The pair is called from a mount effect rather than at module load. That is the only place the
cleanup can be hung, and it is what makes React StrictMode's init → destroy → init cycle
survivable.

The two buttons on the dashboard are two different flows, and only the first of them is Embed UI
code. Both resolve with the id of the offer they created, and nothing else: that id is what both
flows use to read their result from `GET /offers/:id` (`backendApi.getOffer`), which the user
triggers with the **Check status** button in `ui/ActionPanel.tsx`. The read is deliberately
repeatable rather than a one-off, because no offer state is final — see
[`docs/issuer-flow.md`](../../../docs/issuer-flow.md). Each click reports the offer as it stands,
and a dismiss action clears the row when the user is done with it.

**Flow A — issuance by the user.** `issueVC()` opens the Embed UI, which offers two wallets. The
library calls back into this app to create the offer and to deliver the transaction code, so the
backend stays the only thing holding the DTK client ID and secret.

**Flow B — auto-issuance.** No Embed UI, and so no file here: it is one call to
`app/backendApi.ts`'s `createAutoOffer()`, wired straight into the dashboard from `App.tsx`. The
backend creates an offer with notifications enabled and DTK delivers it to the user's wallet, which
is where the flow actually lives — see [`../be/README.md`](../be/README.md).

## Two requirements, and how this app guarantees them

**`internalWallet` requires `userInfo.id`** — without it, `issueVC` throws. `AuthHandler` renders
the app only for a signed-in user, so the token's `sub` is always there to pass.

**`allowContactInput: false` requires `userInfo.email`** — without it, the contact field is shown
regardless. This app requests the `email` scope in `oidcConfig`, so the tenant's Keycloak always
releases it on the verified token.

## Reading order

`app/config.ts` → `integration/useEmbeddedUi.ts` → `integration/issueToAnyWallet.ts` →
`app/backendApi.ts`.
