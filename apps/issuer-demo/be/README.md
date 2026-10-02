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
├── auth/           verifies the end user's Keycloak token on incoming requests
└── claims-source/  stands in for the bank's KYC record of the customer
```

`claims-source/kyc.ts` is the seam where a real integration reads its own system of record; here it
returns fixed claims for the signed-in user.

Nothing outside `client/` and `integration/` holds a DTK credential or knows a DTK URL. The route
handlers in `routes/` translate between this demo's HTTP surface and the functions in
`integration/`.

## The integration

`client/` is the low-level transport: OAuth2 token handling and a generic authenticated fetch
wrapper. `integration/` is the API calls themselves.

DTK exposes two APIs the issuer needs:

- **Control API** — the management plane. Issuers, VC schemas, issuance results.
- **Integration API** — the runtime plane. Creating offers, delivering transaction codes.

| File                            | Calls                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `client/token.ts`               | OAuth2 `client_credentials` token, cached until it expires                    |
| `client/httpClient.ts`          | The authenticated fetch wrapper every call below goes through                 |
| `integration/controlApi.ts`     | `GET /vc-schemas`, `GET /vc-schemas/:id/versions`, `GET /issuance/offers/:id` |
| `integration/integrationApi.ts` | `POST /oid4vci/offers`, `POST /oid4vci/offers/:id/delivery`                   |
| `integration/types.ts`          | Request and response shapes for the calls above                               |
