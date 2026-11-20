# Issuer backend — Acme Bank

The bank's own service. It holds the DTK client ID and secret, creates credential offers on the
customer's behalf, and is the only side that talks to the DTK APIs.

## What is where

```
src/
├── server.ts       Express app and startup
├── config.ts       env vars as one typed object
├── errors.ts       the error shape every route returns
├── routes/         this demo's own HTTP surface — what the frontend calls
├── client/         low-level DTK transport, and the only place credentials live
├── integration/    ← every DTK API call
├── auth/           verifies incoming tokens — the end user's, and DTK's on the Attribute Provider route
└── claims-source/  stands in for the bank's KYC record
```

Routes declare their own auth: `POST /offers`, `POST /offers/auto` and `POST /offers/:id/delivery`
take `requireUser`; `POST /offers/auth-code` and `GET /offers/:id` are public, for a visitor who has
not signed in to the site.

`claims-source/kyc.ts` is the seam where a real integration reads its own system of record; here it
returns fixed claims for the signed-in user, and the same demo customer's claims in the authorization
code flow, where DTK names the holder only by `sub` and the backend has no session for them. There the
national ID number is the holder's `sub`, so the credential shows which account signed in at the wallet.

Nothing outside `client/` and `integration/` holds a DTK credential or knows a DTK URL. The route
handlers in `routes/` translate between this demo's HTTP surface and the functions in
`integration/`.

## The integration

`client/` is the low-level transport: OAuth2 token handling and a generic authenticated fetch
wrapper. `integration/` is the API calls themselves.

DTK exposes two APIs the issuer needs:

- **Control API** — the management plane. Issuers, VC schemas, issuance results.
- **Integration API** — the runtime plane. Creating offers, delivering transaction codes.

| File                            | Calls                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `client/token.ts`               | OAuth2 `client_credentials` token, cached until it expires                                          |
| `client/httpClient.ts`          | The authenticated fetch wrapper every call below goes through                                       |
| `integration/controlApi.ts`     | `GET /vc-schemas`, `GET /issuance/offers/:id`                                                       |
| `integration/integrationApi.ts` | `POST /oid4vci/offers` (pre-authorized and authorization code), `POST /oid4vci/offers/:id/delivery` |
| `integration/types.ts`          | Request and response shapes for the calls above                                                     |

## The Attribute Provider

For the authorization code flow DTK is the caller, not the frontend. `routes/attributeProvider.ts`
serves `POST /attribute-provider/claims`: `auth/serviceToken.ts` accepts only a token from DTK's
machine client in the sign-in realm (`ATTRIBUTE_PROVIDER_AUDIENCE`, `ATTRIBUTE_PROVIDER_CLIENT_ID`),
and the answer is `{ status: 'ok', credentialConfigurationId, claims }` with the demo customer's
claims for any holder. DTK keeps only the claims the credential's schema declares.

Both clients are created in the tenant's realm as part of onboarding — see
[Assumptions](../../../docs/assumptions.md).
