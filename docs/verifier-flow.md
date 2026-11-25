# Verifier flow

Mortgage HUB needs a mortgage applicant's KYC status. Its **Documents** page offers two ways to
supply it — upload documents, or present a credential from a wallet — but only the second is wired
up. There are no accounts or sign-in on the verifier site: presenting the credential is the whole
interaction, and it's the only way the applicant is identified to Mortgage HUB.

1. The user presses **Present KYC VC from the Wallet**, which opens a dialog.
2. They pick a wallet, read its setup steps, and press **Continue**.
3. The Embed UI opens on the QR code, with no choice of wallet: the demo asks only for mobile wallets.
   The Web Custodial Wallet is an option, off by default. To offer it, add `'web'` to `modes` in
   `apps/verifier-demo/be/src/integration/integrationApi.ts` and to `walletPlatform` in
   `apps/verifier-demo/fe/src/integration/presentCredential.ts`.
4. The user scans a QR code with a wallet.
5. The site shows success or failure.

## Two flows

A flow decides which VP schema the request uses, and therefore which Verifier asks. Everything else —
the Embed UI call, the QR code, the response handling — is the same code. These are the demo's own
flows, not DTK's Presentation Flows 1 and 2 — see `POST /requests` below.

| Dialog option           | Flow  | VP schema      | Verifier                         |
| ----------------------- | ----- | -------------- | -------------------------------- |
| KYC VC from EQUS Wallet | `kyc` | `KYC Basic VP` | `Mortgage Hub`, `did_web`        |
| PID VC from EUDI Wallet | `pid` | `PID VP`       | `Mortgage Hub EUDI`, `x509_hash` |

The `pid` flow accepts the PID as an SD-JWT VC or as an mdoc — whichever the wallet holds.

The KYC request is signed and encrypted, and is pinned to the demo issuer's KYC schema — a KYC
credential from anyone else does not satisfy it. The VP schema asks for a subset of the credential's
claims, so the wallet discloses only those. That subset is the point of the demo; see
[schemas.md](schemas.md) for which claims cross and which do not.

The PID requests ask an **EU Digital Identity Wallet** for a credential this demo's issuer never
issued, and are the reason a second Verifier exists at all — see
[eudi-wallet.md](eudi-wallet.md).

## The backend's HTTP surface

Two routes, both unauthenticated — the verifier site has no end-user login, so there is no token to
check. The DTK client ID and secret never leave the backend.

| Route            | Request                                  | Response              |
| ---------------- | ---------------------------------------- | --------------------- |
| `POST /requests` | `{ flow? }`                              | `{ web, mobile, dc }` |
| `POST /verify`   | `{ authResponse, txId, origin?, flow? }` | `{ verified: true }`  |

**`flow` is a menu, not a parameter.** It is one of three literals this backend defines, and it is
the only thing the browser gets to choose. The VP Schema, the Verifier, the encryption setting and
the verifier web URL stay server-held — each is signed into the request object DTK builds, so
letting a browser name one would be letting it decide what this tenant asks for, and on whose
behalf. Omit it and the KYC flow runs.

`POST /requests` maps to one DTK call, `POST /{verifierId}/oid4vp/requests/multi`, which asks for the
`mobile` variant of the request — Presentation Flow 2. DTK's multi endpoint also supports a `dcApi`
(Digital Credentials API) variant — Presentation Flow 1, Android phones only today — and a `web` mode
for the browser-based Web Custodial Wallet, which this demo doesn't request — so both come back
`null`. To offer Flow 1 as well, add `'dcApi'` to `modes` and set `dcApiEnabled: true` on the
frontend; the Embed UI falls back to Flow 2 where the DC API is unavailable. Tenants who want to
offer the Web Custodial Wallet must contact EQUS to have it enabled. Note that the Web Custodial
Wallet cannot process an x509-signed request, so it is not an option for the EUDI flow.

**`POST /verify` is how the result is read.** The Embed UI resolves the wallet's response itself and
hands it to the frontend, which posts it here; the backend passes it to
`POST /{verifierId}/oid4vp/verify` and returns only the outcome. The route carries `flow` for one
reason: only the Verifier that created a request can verify its response, and this demo holds no
state to look that pairing up in.

**The disclosed claims stay on the backend.** The frontend gets the wallet's response encrypted, so
returning the decrypted claims to it afterwards would undo that encryption. A real verifier makes its
decision on them in the backend and sends the browser only the result.

Both routes resolve the Verifier and VP Schema by name before calling DTK — see
[`be/README.md`](../apps/verifier-demo/be/README.md).
