# DTK Demo

Two small, complete examples of integrating the Developer Toolkit — one issuing a credential, one
verifying it. They are meant to be read as much as run.

- **Issuer — Acme Bank.** A customer signs in with the bank's identity provider, and the bank issues
  them a KYC credential: either explicitly, by scanning a QR code with any supported wallet, or
  automatically, pushed straight to their EQUS wallet.
- **Verifier — Mortgage HUB.** A mortgage applicant evidences their KYC status by presenting a
  credential from their wallet instead of uploading documents, disclosing only the claims Mortgage
  HUB asked for. The verifier site does not require any accounts or sign-in.

## Try them

Both demos are hosted and need no setup:

- EU region
  - Issuer (Acme Bank): <https://issuer-demo.eu.equs.ai/>
  - Verifier (Mortgage HUB): <https://verifier-demo.eu.equs.ai/>
- US region
  - Issuer (Acme Bank): <https://issuer-demo.us.equs.ai/>
  - Verifier (Mortgage HUB): <https://verifier-demo.us.equs.ai/>

They run against tenants that are already onboarded and provisioned on the DTK side.
[Assumptions](docs/assumptions.md) covers what that means and which part of an integration these
demos actually show.

## Where to look

Every app half is split three ways, and a lint rule keeps the parts apart: `ui/` may not import
from `integration/`, so the website can be restyled without the integration being touched.

```
apps/<app>/fe/src/          apps/<app>/be/src/
├── integration/  ← DTK     ├── integration/  ← DTK
├── app/          wiring    ├── client/       transport, credentials
└── ui/           website   └── routes/       this demo's HTTP surface
```

To learn the integration, read the four `integration/` folders and their `client/` folders, and
nothing else. Each app half opens with a README mapping its own contents:
[issuer fe](apps/issuer-demo/fe/README.md) · [issuer be](apps/issuer-demo/be/README.md) ·
[verifier fe](apps/verifier-demo/fe/README.md) · [verifier be](apps/verifier-demo/be/README.md).

## Docs

|                                        |                                                      |
| -------------------------------------- | ---------------------------------------------------- |
| [Assumptions](docs/assumptions.md)     | What is already in place, and what these demos cover |
| [Issuer flow](docs/issuer-flow.md)     | The two issuance paths                               |
| [Verifier flow](docs/verifier-flow.md) | The presentation path                                |
| [Schemas](docs/schemas.md)             | KYC credential and presentation schemas              |

Everything these demos do is a small part of what DTK offers. For the full API and the rest of the
Embed UI, see the public documentation: <https://docs.toolkit.equs.ai/>
