# Schemas

Three schemas define what these demos exchange: one describing the credential Acme Bank issues, one
describing what Mortgage HUB asks of it, and one describing what Mortgage HUB asks of an EU Digital
Identity Wallet. All of them already exist on the tenants the demos run against — see
[assumptions.md](assumptions.md) — so this page is a reference for what they contain, not
instructions for creating them. Creating your own is in the public documentation:
`<public-docs-url>`.

## The names are the contract

Neither backend holds a schema ID. Each one lists its tenant's schemas on every request and matches
by name — `KYC Identity` in the issuer demo, one of two names in the verifier demo — then reads the
Issuer or Verifier off the schema it found (`issuers[0]` / `verifiers[0]`). See
`resolveKycVcSchema()` and `resolveFlow()` in the two `integration/controlApi.ts` files; the verifier
demo's two names live in `integration/flows.ts`.

Two consequences worth stating plainly:

- **Renaming either schema breaks the demo that looks for it**, with `vc_schema_not_found` /
  `vp_schema_not_found` on the first button press rather than an opaque `404` from DTK.
- **Reading the Issuer and Verifier off the schema removes a class of misconfiguration.** A schema
  and a Verifier that are not attached to each other fail at request time with an error that names
  neither; taking one from the other means the mismatch cannot be expressed. It is safe here because
  exactly one of each is attached — including with two Verifiers in play, since each VP schema below
  belongs to one of them and not the other.

Holding IDs in configuration is the normal production choice. This lookup-by-name exists because the
entities are provisioned separately from the apps, and it is why neither `.env` carries an `ISSUER_ID`, `VERIFIER_ID`,
`VC_SCHEMA_ID` or `VP_SCHEMA_ID`.

## KYC Identity (VC schema)

Format `SdJwtVc`, signed and bound with `ES256`, holder-bound by `JWK`. It is created `public: true`
— that is what lets a _different_ tenant's VP schema reference it, which is exactly what the
verifier demo does. Credentials expire after a year, and the schema carries the background and text
colours a wallet renders the card with. `assurance` is `high`.

Claims are flat, with one nested group:

| Group                 | Claims                                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(top level)**       | Full name, date of birth, place of birth, email, phone, address, citizenship, country of residence, residence status, national ID number, tax number, identity verification completed at |
| **Identity document** | Type, number, country, expiration date                                                                                                                                                     |

Every demo user gets the same values, except the full name and email, which are taken from the
signed-in user's token.

### Claim paths and types

A claim's `path` is its position in the credential subject, split into segments, and a claim payload
has to nest the same way: `['identity_document', 'type']` means a `type` field inside an
`identity_document` object.

[`be/src/claims-source/kyc.ts`](../apps/issuer-demo/be/src/claims-source/kyc.ts) is keyed to exactly these paths,
and the two are kept in step **by hand** — nothing compares them. A mandatory claim the payload
omits is a 400 from `POST /oid4vci/offers`; a payload field the schema does not declare is silently
dropped from the credential, which is quieter and worse. Revise one and revise the other, and
revise the request that creates the schema with them.

| Path                            | Type     | Mandatory | Value set, where the claim has one                      |
| -------------------------------- | -------- | --------- | --------------------------------------------------------- |
| `full_name`                      | Text     | yes       |                                                           |
| `birth_date`                     | Date     | yes       |                                                           |
| `birth_place`                    | Text     | yes       |                                                           |
| `email`                          | Text     | no        | the signed-in user's token                               |
| `phone`                          | Text     | no        |                                                           |
| `address`                        | Text     | yes       |                                                           |
| `citizenship`                    | Text     | yes       |                                                           |
| `residence_country`              | Text     | yes       |                                                           |
| `residence_status`               | Text     | yes       | `citizen`, `permanent residence permit`, `temporary visa` |
| `national_id_number`             | Text     | no        |                                                           |
| `tax_number`                     | Text     | no        |                                                           |
| `identity_document`              | Display  | yes       |                                                           |
| `identity_document.type`         | Text     | yes       | `passport`, `national identity card`, `driver license`    |
| `identity_document.number`       | Text     | no        |                                                           |
| `identity_document.country`      | Text     | yes       |                                                           |
| `identity_document.expiration`   | Date     | yes       |                                                           |
| `verification_completed_at`      | Date     | yes       |                                                           |

Note that `residence_status` and `identity_document.type` are declared `Text` — the
value sets above are a convention the issuer honours, not something the schema enforces.

## KYC Basic VP (VP schema)

`vcSchemaVersionIds` pins the request to a specific version of the VC schema above, so a KYC
credential from any other issuer, or from a different version of this schema, does not satisfy it.

It requests three of that schema's claims — `full_name`, `birth_date`, `verification_completed_at`
— each `mandatory`. `fullDisclosure` is `false`: the holder is asked for these specific claims
rather than for the credential entire.

## PID VP

What Mortgage HUB asks of an EU Digital Identity Wallet: a name, from the **PID**, which no tenant
here issues — it comes from a Member State's PID Provider and is already in the wallet. So unlike the
two schemas above, this one references a credential *type* rather than a version of a VC schema of
ours.

The PID comes in two formats, and an input's `format` is a single value, so the schema has one input
per format. The type identifier and the claim paths both change with the format — mdoc claims are
namespaced by document type, SD-JWT claims are flat:

| Input `id` | `pid_sdjwt` | `pid_mdoc` |
| --- | --- | --- |
| `credTypes.format` | `dc+sd-jwt` | `mso_mdoc` |
| `credTypes.values` | `urn:eudi:pid:1` | `eu.europa.ec.eudi.pid.1` |
| Claim paths | `['given_name']`, `['family_name']` | `['eu.europa.ec.eudi.pid.1', 'given_name']`, `[…, 'family_name']` |

**How it means "either".** On their own, inputs are conjunctive: a wallet would have to present both
credentials. The schema's `credentialSets` changes that:

```json
"credentialSets": [{ "options": [["pid_sdjwt"], ["pid_mdoc"]] }]
```

Each option is a list of input ids that together satisfy the set, and the wallet presents any one
option. The set has no `required`, so it defaults to `true`: the wallet must present one of the two.
The ids are what the options refer to, and they are also the keys the presented credential comes
back under in `vp_token`.

It is attached to the `Mortgage Hub EUDI` Verifier, and `fullDisclosure` is `false` as above. Why
that Verifier is a separate one is [eudi-wallet.md](eudi-wallet.md).

## The AP2 mandate VP

What the user approves a purchase with in the AP2 demo: the KYC Identity credential above. The AP2
connector's VP schema (purpose `ap2`, "KYC Identity AP2") asks for that credential with no claims, so
nothing personal is disclosed. The payment mandate names the credential's type (`vct`) as its payment
instrument, and the shop checks that the presented credential is of that type and from an issuer it
trusts. The demo's own code never names the schema: the connector looks it up for the tenant.

The `vct` contains the KYC schema version, so a new version of KYC Identity needs the AP2 VP schema
pointed at it, as does the `KYC Basic VP` schema.

---

For the full schema API — versioning, revocation, and everything these schemas do not use — see
the public documentation: `<public-docs-url>`
