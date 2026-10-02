# Schemas

Two schemas define what these demos exchange: one describing the credential Acme Bank issues, and
one describing what Mortgage HUB asks to see. Both already exist on the tenants the demos run
against — see [assumptions.md](assumptions.md) — so this page is a reference for what they contain,
not instructions for creating them. Creating your own is in the public documentation:
`<public-docs-url>`.

## The names are the contract

Neither backend holds a schema ID. Each one lists its tenant's schemas on every request and matches
by name — `KYC VC` in the issuer demo, `KYC VP` in the verifier demo — then reads the Issuer or
Verifier off the schema it found (`issuers[0]` / `verifiers[0]`). See `resolveKycVcSchema()` and
`resolveKycVpSchema()` in the two `integration/controlApi.ts` files.

Two consequences worth stating plainly:

- **Renaming either schema breaks the demo that looks for it**, with `vc_schema_not_found` /
  `vp_schema_not_found` on the first button press rather than an opaque `404` from DTK.
- **Reading the Issuer and Verifier off the schema removes a class of misconfiguration.** A schema
  and a Verifier that are not attached to each other fail at request time with an error that names
  neither; taking one from the other means the mismatch cannot be expressed. It is safe here because
  exactly one of each is attached.

Holding IDs in configuration is the normal production choice. This lookup-by-name exists because the
entities are provisioned by hand, and it is why neither `.env` carries an `ISSUER_ID`, `VERIFIER_ID`,
`VC_SCHEMA_ID` or `VP_SCHEMA_ID`.

## KYC VC schema

Format `SdJwtVc`, signed and bound with `ES256`, holder-bound by `JWK`. It is created `public: true`
— that is what lets a _different_ tenant's VP schema reference it, which is exactly what the
verifier demo does. Credentials expire after a year, and the schema carries the background and text
colours a wallet renders the card with. `assurance` is `high`.

Five claim groups:

| Group            | Claims                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PID**          | Full name, date of birth, citizenship, residence status, country of residence, tax number, identity document type / number / country / date, age above 18, age above 21 |
| **Contact info** | Current address, phone number, email                                                                                                                                    |
| **Sanctions**    | EU Consolidated clearance status, UN Sanctions clearance status, OFAC SDN clearance status, last checked                                                                |
| **PEP**          | PEP status, PEP country of origin                                                                                                                                       |
| **AML**          | Source of wealth verified, source of wealth category, adverse media screening status, AML risk category, AML screening done                                             |

Every demo user gets the same values, except Contact info → email, which is taken from the signed-in
user's token.

### Claim paths and types

A claim's `path` is its position in the credential subject, split into segments, and a claim payload
has to nest the same way: `['contact_info', 'email']` means an `email` field inside a `contact_info`
object. The five group rows are `Display` claims — they carry the label a wallet shows above the
claims beneath them rather than a value of their own.

[`be/src/claims-source/kyc.ts`](../apps/issuer-demo/be/src/claims-source/kyc.ts) is keyed to exactly these paths,
and the two are kept in step **by hand** — nothing compares them. A mandatory claim the payload
omits is a 400 from `POST /oid4vci/offers`; a payload field the schema does not declare is silently
dropped from the credential, which is quieter and worse. Revise one and revise the other, and
revise the request that creates the schema with them.

| Path                               | Type     | Value set, where the claim has one                                                                            |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `pid`                              | Display  |                                                                                                               |
| `pid.full_name`                    | Text     |                                                                                                               |
| `pid.date_of_birth`                | Text     |                                                                                                               |
| `pid.citizenship`                  | Text     |                                                                                                               |
| `pid.residence_status`             | Text     | `citizen`, `permanent residence permit`, `temporary visa`                                                     |
| `pid.country_of_residence`         | Text     |                                                                                                               |
| `pid.tax_number`                   | Text     |                                                                                                               |
| `pid.identity_document_type`       | Text     | `passport`, `national identity card`, `driver license`                                                        |
| `pid.identity_document_number`     | Text     |                                                                                                               |
| `pid.identity_document_country`    | Text     |                                                                                                               |
| `pid.identity_document_date`       | Text     |                                                                                                               |
| `pid.age_above_18`                 | Boolean  |                                                                                                               |
| `pid.age_above_21`                 | Boolean  |                                                                                                               |
| `contact_info`                     | Display  |                                                                                                               |
| `contact_info.current_address`     | Text     |                                                                                                               |
| `contact_info.phone_number`        | Text     |                                                                                                               |
| `contact_info.email`               | Text     | the signed-in user's token                                                                                    |
| `sanctions`                        | Display  |                                                                                                               |
| `sanctions.eu_consolidated_status` | Text     | `cleared`, `false positive resolved`, `match detected`                                                        |
| `sanctions.un_sanctions_status`    | Text     | as above                                                                                                      |
| `sanctions.ofac_sdn_status`        | Text     | as above                                                                                                      |
| `sanctions.last_checked`           | DateTime |                                                                                                               |
| `pep`                              | Display  |                                                                                                               |
| `pep.status`                       | Text     | `not PEP`, `PEP domestic`, `PEP foreign`, `PEP associate`                                                     |
| `pep.country_of_origin`            | Text     | `N/A` unless the status is something other than `not PEP`                                                     |
| `aml`                              | Display  |                                                                                                               |
| `aml.source_of_wealth_verified`    | Boolean  |                                                                                                               |
| `aml.source_of_wealth_category`    | Text     | `Salary`, `Inheritance`, `SaleOfRealEstate`, `CorporateDividends`, `CryptoInvestments`, `InvestmentPortfolio` |
| `aml.adverse_media_status`         | Text     | `Cleared`, `NoMatch`, `ReviewPassed`                                                                          |
| `aml.risk_category`                | Text     | `High`, `Medium`, `Low`                                                                                       |
| `aml.screening_done`               | DateTime |                                                                                                               |

Note that every enumerated claim is declared `Text`, not `Array` — the value sets above are a
convention the issuer honours, not something the schema enforces.

## KYC VP schema

A deliberate subset, to show selective disclosure: 13 of the credential's claims, with `pep` and the
whole of `aml` beyond the risk category left out. The wallet discloses these and nothing else.

`vcSchemaIds` pins the request to the VC schema above, so a KYC credential from any other issuer
does not satisfy it. Every claim is `mandatory`, and `fullDisclosure` is `false` — the holder is
asked for these specific claims rather than for the credential entire.

| Group            | Claims requested                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **PID**          | Full name, citizenship, residence status, country of residence, tax number, age above 18 |
| **Contact info** | Current address, phone number, email                                                     |
| **Sanctions**    | EU Consolidated clearance status, last checked                                           |
| **AML**          | AML risk category, AML screening done                                                    |

---

For the full schema API — versioning, revocation, and everything these two schemas do not use — see
the public documentation: `<public-docs-url>`
