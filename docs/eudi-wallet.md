# EU Digital Identity Wallets

Mortgage HUB's present dialog offers an **EU Digital Identity Wallet** option, which asks for a PID
instead of the KYC credential the issuer demo hands out. It is the same OID4VP exchange as the KYC
flow, and the demo's own code barely changes between them — which is the point of this page. Almost
everything that makes an EUDI Wallet answer is provisioning, done once, before any of this code
runs.

## What a PID is

**PID** — Person Identification Data — is the foundational identity credential every EUDI Wallet
holds, issued by a Member State's PID Provider. It is the one credential you can ask an arbitrary
EUDI-conformant wallet for and expect an answer to.

It comes in two formats, `dc+sd-jwt` and `mso_mdoc`, and a wallet may hold either or both. The demo
asks for it once: a single VP schema, `PID VP`, has one input per format and a credential set that
lets the wallet present whichever one it holds. One request, one QR code, one result. See
[schemas.md](schemas.md) for how the schema expresses "either".

## What was provisioned for this demo

An EUDI Wallet will not answer a request from a Verifier it cannot identify by certificate, so the
PID flows run against their own Verifier, `Mortgage Hub EUDI`, differing from `Mortgage Hub` in two
fields — both the tenant's own, both set once through the Control API:

- **`clientIdPrefix` is `x509_hash`** rather than the default `did_web`. `client_id` then names the
  deployment's access certificate, and the signed request object carries that certificate's chain
  instead of a `did:web` document a wallet would have to resolve over the network.
- **`trustedRootCerts` holds the EUDI Wallet Reference Implementation PID Issuer CAs** of the
  **pre-production** ecosystem, base64 DER. The PID is anchored by an X.509 chain rather than a DID,
  and this list is per-Verifier and empty by default, so without it the presentation fails on an
  untrusted issuer. Which roots you need is decided by the ecosystem you verify in; point a wallet
  at a different one and these are the wrong roots.

The **access certificate** both depend on is not a tenant's. It belongs to the whole deployment, is
issued by an accredited Access CA in the service provider's name, and is installed and activated by
EQUS — a tenant never supplies it or holds a copy. Until one is active in the environment, creating
an x509 Verifier still succeeds but every request from it fails with `no_request_signing_cert`, and
there is no workaround on the tenant side.

## Setting this up yourself

Both sides of it — obtaining, installing and activating an access certificate, and switching a
Verifier to x509, registering an intended use and populating its trusted roots — are documented in
the public DTK documentation: `<public-docs-url>`.

## What this demo deliberately leaves out

**A registration certificate.** Every x509 Verifier on a deployment presents the _same_ `client_id`,
because the certificate behind it belongs to the deployment rather than to any one tenant. So
nothing in these requests says which organisation is asking, or what it is authorised to ask for.
The thing that says so is a second certificate, issued to a tenant by its national Registrar and
registered against the Verifier as an **intended use**. This demo has none. That is enough for pilot
interop and is **not** enough for production — a conformant wallet may refuse on exactly that basis,
and a tenant copying this demo should register an intended use before shipping it.

## Setting up a wallet to try it

1. Install the **EUDI Wallet reference app** (Android or iOS) and point it at the **pre-production**
   ecosystem — the one the roots above belong to. A production wallet trusts a different set of
   certificates and will not answer.
2. Issue yourself a **PID** from the reference PID issuer, in either format. The request accepts an
   SD-JWT PID or an mDoc PID; a wallet holding both presents one of them.
3. Pick the EUDI Wallet option in the dialog, press **Continue**, and scan the QR code with that wallet.
4. Approve the request. The demo asks only for given name and family name.

The KYC credential from the issuer demo does not satisfy these requests, and a PID does not satisfy
the KYC one. Different credentials, different issuers.

## Where the code is

Almost nowhere, which is the honest summary.

|                                           |                                                   |
| ----------------------------------------- | ------------------------------------------------- |
| `be/src/integration/flows.ts`             | The two flows and the VP schema each one names    |
| `be/src/integration/controlApi.ts`        | Resolves a flow to its schema and Verifier        |
| `fe/src/integration/presentCredential.ts` | One `presentVCs()` call, identical for every flow |

Nothing in `presentCredential.ts` knows whether the Verifier behind a flow is `did_web` or x509. The
Verifier, its prefix, its trusted roots and the PID schema are not here at all: they are
provisioning, done once before any of this runs, in the same way as everything in
[assumptions.md](assumptions.md). Supporting EUDI Wallets is a provisioning decision, not a
client-side one.

## When it does not work

| What you see                                 | What it means                                                                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A `request_signing_cert` error of any kind   | No access certificate is active, or it is revoked, expired or issued for another host. The service provider's to fix, with no tenant workaround. |
| The wallet refuses or ignores the QR         | It does not trust the deployment's certificate chain. Check the wallet is pointed at the same ecosystem the access certificate was issued for. |
| Verification fails on an untrusted issuer    | `trustedRootCerts` is empty, or holds the wrong ecosystem's roots.                                                                             |
| The wallet says it has nothing to present    | It holds no PID.                                                                                                                               |
