# DTK Demo

Small, complete examples of integrating the Developer Toolkit — one issuing a credential, one
verifying it, and one where an AI assistant buys with an approval from the user's wallet. They are
meant to be read as much as run.

- **Issuer — Acme Bank.** The bank issues a KYC credential: explicitly, by scanning a QR code with a
  wallet, or automatically, pushed straight to the customer's EQUS wallet. Signing in to the site is
  optional — signed out, the customer signs in with the bank inside their mobile wallet instead, and
  the bank supplies their claims at issuance (the authorization code flow).
- **Verifier — Mortgage HUB.** A mortgage applicant evidences their KYC status by presenting a
  credential from their wallet instead of uploading documents, disclosing only the claims Mortgage
  HUB asked for. The verifier site does not require any accounts or sign-in. It also asks for a
  **PID** from an EU Digital Identity Wallet, in either of the two formats one comes in — see
  [EUDI Wallets](docs/eudi-wallet.md).
- **Agent payments — AP2.** An AI assistant buys a pair of sneakers through a Tenant's AP2
  connector on DTK, and only what the user approves in their wallet with their KYC credential. One page:
  a scripted chat whose every tool call is real, and a guide to doing the same in the user's own
  assistant — see [AP2 flow](docs/ap2-flow.md).

## Try them

The issuer and verifier demos are hosted and need no setup:

- EU region
  - Issuer (Acme Bank): <https://issuer-demo.eu.equs.ai/>
  - Verifier (Mortgage HUB): <https://verifier-demo.eu.equs.ai/>
- US region
  - Issuer (Acme Bank): <https://issuer-demo.us.equs.ai/>
  - Verifier (Mortgage HUB): <https://verifier-demo.us.equs.ai/>

They run against tenants that are already onboarded and provisioned on the DTK side.
[Assumptions](docs/assumptions.md) covers what that means and which part of an integration these
demos actually show. The agent payments demo is not hosted yet.

## Where to look

Every app half is split three ways, and a lint rule keeps the parts apart: `ui/` may not import
from `integration/`, so the website can be restyled without the integration being touched.

```
apps/<app>/fe/src/          apps/<app>/be/src/
├── integration/  ← DTK     ├── integration/  ← DTK
├── app/          wiring    ├── client/       transport, credentials
└── ui/           website   └── routes/       this demo's HTTP surface
```

Backends add folders of their own next to these where a demo needs one — `auth/` for the
signed-in user, `claims-source/` and `merchant/` for the systems a real integration would already
have.

To learn the integration, read the `integration/` folders and the `client/` folders next to them,
and nothing else. Each app half opens with a README mapping its own contents:
[issuer fe](apps/issuer-demo/fe/README.md) · [issuer be](apps/issuer-demo/be/README.md) ·
[verifier fe](apps/verifier-demo/fe/README.md) · [verifier be](apps/verifier-demo/be/README.md) ·
[AP2 fe](apps/ap2-demo/fe/README.md) · [AP2 be](apps/ap2-demo/be/README.md).

## Docs

|                                                   |                                                      |
| ------------------------------------------------- | ---------------------------------------------------- |
| [Assumptions](docs/assumptions.md)                | What is already in place, and what these demos cover |
| [Issuer flow](docs/issuer-flow.md)                | The issuance paths, signed in and signed out         |
| [Authorization code flow](docs/auth-code-flow.md) | What a tenant sets up to issue via its own login     |
| [Verifier flow](docs/verifier-flow.md)            | What the present dialog offers, and why              |
| [EUDI Wallets](docs/eudi-wallet.md)               | Being answered by an EU Digital Identity Wallet      |
| [Schemas](docs/schemas.md)                        | The credential and presentation schemas              |
| [AP2 flow](docs/ap2-flow.md)                      | An AI assistant paying with the user's approval      |

Everything these demos do is a small part of what DTK offers. For the full API and the rest of the
Embed UI, see the public documentation: <https://docs.toolkit.equs.ai/>
