# Issuer frontend — Acme Bank

A customer receives a KYC credential in their wallet: either explicitly, by picking a wallet in the
Embed UI, or automatically, pushed to their EQUS wallet. Signing in with the bank's identity provider
is optional: signed out, the same button issues through the authorization code flow, and the holder
signs in with the bank inside their wallet instead.

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
one typed object, `auth.ts` and `AuthHandler.tsx` hold the optional end-user session against the
tenant's external Keycloak (BYOIdP), `backendApi.ts` calls this demo's own backend with the user's
token attached when there is one, and `types.ts` carries the shapes they exchange.

`ui/` is the bank's website — layout, dashboard, styles, icons. It takes plain data and plain
handlers as props and imports nothing from `integration/`. The flow state for the two buttons lives
in `ui/ActionPanel.tsx`, next to the copy that renders it.

If you are reading this repo to learn the integration, `src/integration/` and
[`../be/README.md`](../be/README.md) are the whole story on the issuer side.

## The integration

| File                           | What it does                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `integration/useEmbeddedUi.ts` | The single `initEmbeddedUi()` / `cleanUpEmbeddedUi()` pair                      |
| `integration/issueKycVc.ts`    | Flow A — "Issue KYC VC to any Wallet", via `issueVC()`, signed in or signed out |

The pair is called from a mount effect rather than at module load. That is the only place the
cleanup can be hung, and it is what makes React StrictMode's init → destroy → init cycle
survivable.

The two buttons on the dashboard are two different flows, and only A is Embed UI code.
Each resolves with the id of the offer it created, and nothing else: that id is what every flow
uses to read their result from `GET /offers/:id` (`backendApi.getOffer`), which the user
triggers with the **Check status** button in `ui/ActionPanel.tsx`. Signed out, the panel shows
no status row at all once the offer exists, since an authorization code offer's state stays
`pending`. The read is deliberately
repeatable rather than a one-off, because no offer state is final — see
[`docs/issuer-flow.md`](../../../docs/issuer-flow.md). Each click reports the offer as it stands,
and a dismiss action clears the row when the user is done with it.

**Flow A — issuance by the user.** `issueVC()` opens the Embed UI. The library calls back into this
app to create the offer and to deliver the transaction code, so the backend stays the only thing
holding the DTK client ID and secret. Which offer it creates depends on the session:

- **Signed in:** a pre-authorized code offer for this user (`POST /offers`), with `userInfo`. The Embed
  UI offers two wallets and delivers the transaction code.
- **Signed out:** an authorization code offer (`POST /offers/auth-code`), passed as
  `flow: 'authorization_code'` with no `userInfo` or `deliverTxCode`. The Embed UI offers mobile
  wallets only and delivers no transaction code: the holder signs in with the bank inside their
  wallet, and DTK fetches their claims from the backend's Attribute Provider.

**Flow B — auto-issuance.** Signed in only: the button is disabled when signed out. No Embed UI, and so no file here: it is one call to
`app/backendApi.ts`'s `createAutoOffer()`, wired straight into the dashboard from `App.tsx`. The
backend creates an offer with notifications enabled and DTK delivers it to the user's wallet, which
is where the flow actually lives — see [`../be/README.md`](../be/README.md).

## Two requirements, and how this app guarantees them

**`internalWallet` requires `userInfo.id`** for a pre-authorized code offer — without it, `issueVC`
throws unless `manualTxCode` is set. Signed in, the token's `sub` is passed; signed out, the offer
uses `flow: 'authorization_code'`, which needs no user.

**`allowContactInput: false` requires `userInfo.email`** — without it, the contact field is shown
regardless. This app requests the `email` scope in `oidcConfig`, so the tenant's Keycloak always
releases it on the verified token.

## Reading order

`app/config.ts` → `integration/useEmbeddedUi.ts` → `integration/issueKycVc.ts` →
`app/backendApi.ts`.
