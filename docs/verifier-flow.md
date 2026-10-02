# Verifier flow

Mortgage HUB needs a mortgage applicant's KYC status. Its **Documents** page offers two ways to
supply it — upload documents, or present a KYC credential from a wallet — but only the second is
wired up. There are no accounts or sign-in on the verifier site: presenting the credential is the
whole interaction, and it's the only way the applicant is identified to Mortgage HUB.

1. The user presses **Present KYC VC from the Wallet**.
2. The Embed UI opens with two wallet options: EQUS Mobile Wallet and Other.
3. The user scans a QR code with either wallet.
4. The site shows success or failure.

The presentation request is signed and encrypted, and is pinned to the demo issuer's KYC schema — a
KYC credential from anyone else does not satisfy it. The VP schema asks for a subset of the
credential's claims, so the wallet discloses only those. That subset is the point of the demo; see
[schemas.md](schemas.md) for which claims cross and which do not.

## The backend's HTTP surface

Two routes, both unauthenticated — the verifier site has no end-user login, so there is no token to
check. The DTK client ID and secret never leave the backend.

| Route            | Request                           | Response              |
| ---------------- | --------------------------------- | --------------------- |
| `POST /requests` | _no body_                         | `{ web, mobile, dc }` |
| `POST /verify`   | `{ authResponse, txId, origin? }` | `{ verifiedClaims }`  |

**`POST /requests` takes no body.** The VP Schema, the Verifier, the encryption setting and the
verifier web URL are all server-held: each is signed into the request object DTK builds, so a body
would be a browser deciding what this tenant asks for, and on whose behalf. It maps to one DTK call,
`POST /{verifierId}/oid4vp/requests/multi`, which asks for the `mobile` variant of the request. DTK's
multi endpoint also supports a `dcApi` (Digital Credentials API) variant, and a `web` mode for the browser-based Web Custodial Wallet, which this demo doesn't
request — so both come back `null`. Tenants who want to offer the Web Custodial Wallet must contact
EQUS to have it enabled.

**`POST /verify` is how the result is read.** The Embed UI resolves the wallet's response itself and
hands it to the frontend, which posts it here; the backend passes it to
`POST /{verifierId}/oid4vp/verify` and returns the claims.

Both routes resolve the Verifier and VP Schema by name before calling DTK — see
[`be/README.md`](../apps/verifier-demo/be/README.md).
