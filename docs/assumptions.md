# Assumptions

An integration with DTK has two halves. The first is setup: registering a tenant, onboarding it,
and creating the entities and schemas it will use. The second is runtime: asking DTK to issue a
credential, to verify one that a wallet presents, or to have a user approve a payment with one.

**These demos are the second half only.** Everything in the first half is already done for the
tenants they run against, and none of it appears in this code. That is deliberate — setup happens
once, from the Operator Portal or the management API, while the code below is what a tenant writes
and ships.

## What is already in place

| Assumed                                                                                                                                                                                                                                                                                            | Why the demo needs it                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Two tenants registered on DTK, one for the issuer and one for the verifier, each with a `client-id` and `client-secret`                                                                                                                                                                            | Each backend authenticates to DTK as its own tenant with those credentials. They are the only secrets in the demo, and they never leave the backend.                                 |
| An Operator Portal user for each tenant                                                                                                                                                                                                                                                            | How the setup below is done and inspected.                                                                                                                                           |
| The issuer tenant's Keycloak configured as its external identity provider (BYOIdP)                                                                                                                                                                                                                 | The issuer demo signs its end users in against the tenant's own realm, and binds each credential to the user it just authenticated. The verifier demo has no sign-in and needs none. |
| An Issuer and a `KYC Identity` schema on the issuer tenant; a Verifier and a `KYC Basic VP` schema on the verifier tenant                                                                                                                                                                          | These are what the backends look up at runtime. Neither holds an entity ID — see [schemas.md](schemas.md).                                                                           |
| For the authorization code flow (signed out): the issuer tenant's realm set as the Issuer's Authorization Server with a scope of its own, the EQUS wallet's sign-in client in that realm, and the issuer backend registered as the tenant's Attribute Provider with a machine client of that realm | DTK sends the holder to the bank's own sign-in and then asks the backend for their claims. See [issuer-flow.md](issuer-flow.md).                                                     |
| A second Verifier on the verifier tenant with `clientIdPrefix` `x509_hash`, its `trustedRootCerts` holding the EUDI PID Issuer roots, and the `PID VP` schema attached to it                                                                                                                       | What the dialog's EUDI Wallet option presents against. Both fields are the tenant's own — see [eudi-wallet.md](eudi-wallet.md).                                                      |
| The **AP2 connector** enabled for the issuer tenant, with a VP schema of purpose `ap2` asking for the KYC credential's `email`                                                                                                                                                                     | What the AP2 demo buys through. The connector and its approval page run on DTK; the user approves each purchase by presenting their KYC credential — see [schemas.md](schemas.md).   |
| A public sign-in client in DTK's users realm whose tokens the AP2 connector accepts                                                                                                                                                                                                                | How the AP2 demo's chat connects the AP2 connector as the user, the same way an AI assistant does when the user adds the connector.                                                  |
| An **access certificate** active on the deployment                                                                                                                                                                                                                                                 | What an EUDI Wallet identifies the Verifier by. Obtained from an accredited Access CA and installed by EQUS, not by a tenant; without it every x509 request fails closed.            |

Doing any of this yourself is documented in the public DTK documentation: `<public-docs-url>`.
This page does not repeat it.

## Three names, three layers

Worth separating before reading further, because they are easy to conflate and only one of them is
what a holder sees:

| Layer                        | Issuer side                       | Verifier side                         |
| ---------------------------- | --------------------------------- | ------------------------------------- |
| Tenant                       | `Demo Issuer`, slug `demo-issuer` | `Demo Verifier`, slug `demo-verifier` |
| DTK Issuer / Verifier entity | `Acme Bank`                       | `Mortgage Hub`                        |
| The website's own branding   | Acme Bank                         | Mortgage HUB                          |

The **tenant slug** is what the Embed UI appends to its origins to load a tenant's branding, and
what a holder types the first time they sign in to the EQUS Mobile Wallet. The **entity name** is
what a wallet displays as the issuer of a credential. The website's branding is just CSS.

The AP2 demo has no tenant of its own: it uses the issuer tenant's AP2 connector, `demo-issuer`.

## What these demos do not show

Named here so that nothing below is mistaken for a recommendation:

- **No real KYC.** Every claim value is a constant in
  [`be/src/claims-source/kyc.ts`](../apps/issuer-demo/be/src/claims-source/kyc.ts), except the email and
  name, which come from the signed-in user — their token, or for the authorization code flow, their
  record in the sign-in realm. A real issuer attests what it has actually verified.
- **Open offer creation when signed out.** `POST /offers/auth-code` and `GET /offers/:id` need no
  token, so anyone can create authorization code offers against the demo tenant. There is no rate
  limit; a real issuer would add one, or create these offers only for its own visitors.
- **No persistence.** No app has a database. The issuer checks DTK for an offer's outcome on
  demand (a "Check status" button); the verifier holds the result in component state, and its
  backend discards the disclosed claims once DTK has verified them; the AP2 demo's stand-in shop keeps
  its checkouts in memory.
- **No sign-in on the verifier.** Its two routes are unauthenticated, which is realistic for a
  public "prove something about yourself" page but is not a general pattern — see
  [verifier-flow.md](verifier-flow.md).
- **No wallet.** The wallet is the holder's own software. The Embed UI brokers the exchange; nothing
  in this repo implements one.
- **No revocation, no credential lifecycle, no multi-tenancy.** DTK supports more than these
  flows use.
- **No registration certificate.** The EUDI flows identify the deployment, not this tenant, so
  nothing in those requests says which organisation is asking or what it may ask for. Enough for
  pilot interop, not enough for production — see [eudi-wallet.md](eudi-wallet.md).

## Running your own copy

The hosted demos linked from the [README](../README.md) are the way to try these flows. Standing up
your own copy needs a DTK tenant with the entities above already provisioned, and per-environment
configuration that is specific to the environment it runs in — so the code here is written to be
read and adapted rather than cloned and started.

If you are building the equivalent against your own tenant, the `src/integration/` folders are the
place to start — [issuer fe](../apps/issuer-demo/fe/README.md) ·
[issuer be](../apps/issuer-demo/be/README.md) · [verifier fe](../apps/verifier-demo/fe/README.md) ·
[verifier be](../apps/verifier-demo/be/README.md) · [AP2 fe](../apps/ap2-demo/fe/README.md) ·
[AP2 be](../apps/ap2-demo/be/README.md) — and the rest of each website can be ignored.
