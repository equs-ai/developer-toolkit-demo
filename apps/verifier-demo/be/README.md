# Verifier backend — Mortgage HUB

Mortgage HUB's own service. It holds the DTK client ID and secret, generates presentation requests
and triggers verification on the tenant's behalf, and is the only side that talks to the DTK APIs.
Receiving and processing the wallet's VP response is handled by the DTK backend and Embed UI, so
the tenant never has to deal with it.

## What is where

```
src/
├── server.ts       Express app and startup
├── config.ts       env vars as one typed object
├── errors.ts       the error shape every route returns
├── routes/         this demo's own HTTP surface — what the frontend calls
├── client/         low-level DTK transport, and the only place credentials live
└── integration/    ← every DTK API call
```

There is no auth here: the verifier site has no accounts and no sign-in, so nothing identifies the
applicant before the presentation.

Nothing outside `client/` and `integration/` holds a DTK credential or knows a DTK URL. The route
handlers in `routes/` translate between this demo's HTTP surface and the functions in
`integration/`.

## The integration

`client/` is the low-level transport: OAuth2 token handling and a generic authenticated fetch
wrapper. `integration/` is the API calls themselves.

| File                            | Calls                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `client/token.ts`               | OAuth2 `client_credentials` token, cached until it expires                     |
| `client/httpClient.ts`          | The authenticated fetch wrapper every call below goes through                  |
| `integration/integrationApi.ts` | `POST /{verifierId}/oid4vp/requests/multi`, `POST /{verifierId}/oid4vp/verify` |
| `integration/controlApi.ts`     | `GET /vp-schemas` — resolves the VP Schema and Verifier by schema name         |
| `integration/types.ts`          | Request and response shapes for the calls above                                |
