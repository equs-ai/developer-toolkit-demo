# Authorization code flow

How an issuer issues a credential to a holder who signs in with the issuer's own login, inside their
wallet, instead of being identified up front. In this demo it is what **Issue KYC VC to any Wallet**
does when the visitor has not signed in to the site — see [Issuer flow](issuer-flow.md).

Use it when the claims live behind your login: you do not need to know who the holder is when you
create the offer. DTK sends the wallet to your Authorization Server, the holder signs in there, and at
issuance DTK asks your **Attribute Provider** for that holder's claims.

```
Issuer site ──POST /oid4vci/offers (flow: authorization_code)──▶ DTK ──offer──▶ Embed UI QR code
Wallet ──scans──▶ your Authorization Server (holder signs in) ──access token──▶ DTK
DTK ──POST <attribute provider> { sub, … }──▶ your backend ──{ status: 'ok', claims }──▶ DTK ──credential──▶ Wallet
```

## What a tenant sets up

All once per Issuer or Tenant, before the first offer.

| Piece                             | Where                                                    | What it is                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A scope for the Issuer            | Your Authorization Server                                | One scope per Issuer. Tokens carrying it must name the Issuer's `credential_issuer` in `aud`; in Keycloak that is an audience mapper on the client scope.                                                |
| The wallet's sign-in client       | Your Authorization Server                                | A public client with PKCE, offered that scope, redirecting to the wallet's callback URIs.                                                                                                                |
| The Issuer's Authorization Server | DTK — `PUT /issuers/{id}/authorization-server`           | `{ url, jwksUri, allowedAudiences, scope }`. `url` must equal the tokens' `iss`; `allowedAudiences` holds the Issuer's `credential_issuer`. Editing the Issuer later resets its scope — send this again. |
| A machine client for DTK          | Your Authorization Server (or any OAuth2 token endpoint) | `client_credentials`, with an audience your Attribute Provider checks.                                                                                                                                   |
| The Tenant's Attribute Provider   | DTK — `PUT /tenants/me/claims-integration`               | `{ client: { tokenUrl, clientId, clientSecret }, attributeProvider: { endpointUrl } }`. The PUT replaces the whole integration, so carry over an existing `webhook` block.                               |

The Issuer's `credential_issuer` is in its public metadata, at
`<protocol API origin>/.well-known/openid-credential-issuer/api/v1/<tenant slug>/iss/<issuer id>/oid4vci`.

## The Attribute Provider contract

DTK calls `endpointUrl` with a `client_credentials` token from the machine client above, and an
`x-request-id` header worth logging:

```json
{ "sub": "<holder's sub at your Authorization Server>", "credentialIssuer": "<credential_issuer>", "credentialConfigurationId": "<id>" }
```

It expects one of:

```json
{ "status": "ok", "credentialConfigurationId": "<id>", "claims": { "…": "…" } }
```

```json
{ "status": "denied", "reason": "unknown_subject" }
```

DTK keeps only the claims the credential's schema declares.

## Where this demo does each part

| Part                                | File                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Creating the offer                  | [`be/src/integration/integrationApi.ts`](../apps/issuer-demo/be/src/integration/integrationApi.ts) — `createAuthCodeOffer` |
| The public offer route              | [`be/src/routes/offers.ts`](../apps/issuer-demo/be/src/routes/offers.ts) — `POST /offers/auth-code`                        |
| Opening the Embed UI without a user | [`fe/src/integration/issueKycVc.ts`](../apps/issuer-demo/fe/src/integration/issueKycVc.ts)                                 |
| The Attribute Provider route        | [`be/src/routes/attributeProvider.ts`](../apps/issuer-demo/be/src/routes/attributeProvider.ts)                             |
| Checking DTK's token                | [`be/src/auth/serviceToken.ts`](../apps/issuer-demo/be/src/auth/serviceToken.ts) — issuer, audience and client             |
| The holder's claims                 | [`be/src/claims-source/kyc.ts`](../apps/issuer-demo/be/src/claims-source/kyc.ts) — stands in for your customer records     |

The frontend passes the offer to `issueVC` with `flow: 'authorization_code'`, and no user or
transaction code delivery: the Embed UI offers mobile wallets only. A real issuer replaces `claims-source/` with its own system of record;
the rest carries over as is.
