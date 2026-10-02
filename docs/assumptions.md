# Assumptions

An integration with DTK has two halves. The first is setup: registering a tenant, onboarding it,
and creating the entities and schemas it will use. The second is runtime: asking DTK to issue a
credential, or to verify one that a wallet presents.

**These demos are the second half only.** Everything in the first half is already done for the
tenants they run against, and none of it appears in this code. That is deliberate — setup happens
once, from the Operator Portal or the management API, while the code below is what a tenant writes
and ships.

## What is already in place

| Assumed                                                                                                                 | Why the demo needs it                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Two tenants registered on DTK, one for the issuer and one for the verifier, each with a `client-id` and `client-secret` | Each backend authenticates to DTK as its own tenant with those credentials. They are the only secrets in the demo, and they never leave the backend.                                 |
| An Operator Portal user for each tenant                                                                                 | How the setup below is done and inspected.                                                                                                                                           |
| The issuer tenant's Keycloak configured as its external identity provider (BYOIdP)                                      | The issuer demo signs its end users in against the tenant's own realm, and binds each credential to the user it just authenticated. The verifier demo has no sign-in and needs none. |
| An Issuer and a `KYC VC` schema on the issuer tenant; a Verifier and a `KYC VP` schema on the verifier tenant           | These are what the backends look up at runtime. Neither holds an entity ID — see [schemas.md](schemas.md).                                                                           |

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

## What these demos do not show

Named here so that nothing below is mistaken for a recommendation:

- **No real KYC.** Every claim value is a constant in
  [`be/src/claims-source/kyc.ts`](../apps/issuer-demo/be/src/claims-source/kyc.ts), except the email, which comes
  from the signed-in user's token. A real issuer attests what it has actually verified.
- **No persistence.** Neither app has a database. The issuer checks DTK for an offer's outcome on
  demand (a "Check status" button); the verifier holds the result in component state and logs the
  disclosed claims to the console.
- **No sign-in on the verifier.** Its two routes are unauthenticated, which is realistic for a
  public "prove something about yourself" page but is not a general pattern — see
  [verifier-flow.md](verifier-flow.md).
- **No wallet.** The wallet is the holder's own software. The Embed UI brokers the exchange; nothing
  in this repo implements one.
- **No revocation, no credential lifecycle, no multi-tenancy.** DTK supports more than these two
  flows use.

## Running your own copy

The hosted demos linked from the [README](../README.md) are the way to try these flows. Standing up
your own copy needs a DTK tenant with the entities above already provisioned, and per-environment
configuration that is specific to the environment it runs in — so the code here is written to be
read and adapted rather than cloned and started.

If you are building the equivalent against your own tenant, the four `src/integration/` folders are
the place to start — [issuer fe](../apps/issuer-demo/fe/README.md) ·
[issuer be](../apps/issuer-demo/be/README.md) · [verifier fe](../apps/verifier-demo/fe/README.md) ·
[verifier be](../apps/verifier-demo/be/README.md) — and the rest of each website can be ignored.
