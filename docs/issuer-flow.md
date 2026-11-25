# Issuer flow

Acme Bank issues a KYC credential to a customer. Signing in to the site is optional, and decides
which OID4VCI flow runs under the same button.

Sign-in is real: **Log in** redirects to the tenant's own Keycloak (BYOIdP), and the backend verifies
the token on every route that needs a user. `sub` binds the offer to the holder and `email` becomes
the credential's Contact Info claim. **Log out** returns to the site signed out.

Signed in, the bank's page also tells the user to log in to the Mobile Wallet with the same
credentials, under the tenant **slug** — needed on first sign-in.

## A. Issue KYC VC to any Wallet

### Signed in — pre-authorized code

The user picks a wallet in the Embed UI.

**A1 — EQUS Mobile Wallet.** A QR code appears. They scan it and accept the credential; the wallet
fetches the transaction code itself, so there is nothing to input.

**A2 — Other Wallet.** A transaction code is emailed to the address they signed in with. A QR code
appears; they scan it, enter the code, and accept the credential.

A browser-based Web Custodial Wallet is also available as a wallet option, but it is not enabled in
this demo; tenants who want it must contact EQUS.

### Signed out — authorization code

The same button. The site knows nobody, so it creates an authorization code offer instead. A QR code
appears, offering mobile wallets only. The user scans it, and the wallet sends them to the bank's own
sign-in page — the same realm the website uses. Once they sign in, DTK asks the bank's backend for
their claims, and the wallet receives the credential. There is no transaction code, and the offer is
not bound to anyone in advance: whoever signs in at the wallet receives their own claims.

This is the flow for an issuer whose claims live behind its own login. The bank's backend plays the
**Attribute Provider**: DTK calls it at issuance time with the signed-in holder's `sub`, and it answers
with that customer's claims, or refuses. [Authorization code flow](auth-code-flow.md) lists every
piece a tenant sets up for it.

## B. Auto-issue KYC VC to EQUS Wallet

Signed in only — it pushes the offer to the user's EQUS Wallet account, so it needs to know who they
are. Signed out, the button is disabled with a hint to log in.

No QR code (the user needs to be signed in to the issuer's ExtIdp for this to work). The offer is
pushed to the user's EQUS wallet — email, plus a push notification if they are signed in on mobile are sent.
They open the wallet and accept from their pending offers.

In this demo a button triggers it, but nothing about the flow requires user interaction; a real
tenant would fire it from their own business logic.

## The backend's HTTP surface

Six routes. The backend verifies Bearer tokens from the tenant's external Keycloak via JWKS and keeps
no session of its own. Three take the end user's token, the Attribute Provider route takes only DTK's
machine-client token, and the two the signed-out path needs are public.

| Route                             | Auth          | Request                                                | Response                                                    |
| --------------------------------- | ------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `POST /offers`                    | end user      | _no body_                                              | `{ uriId, byReference }`                                    |
| `POST /offers/auth-code`          | public        | _no body_                                              | `{ uriId, byReference }`                                    |
| `POST /attribute-provider/claims` | DTK's machine | `{ sub, credentialIssuer, credentialConfigurationId }` | `{ status, credentialConfigurationId, claims }`             |
| `POST /offers/auto`               | end user      | _no body_                                              | `{ uriId }`                                                 |
| `POST /offers/:id/delivery`       | end user      | `{ method }`                                           | `{ txCodeFetchUrl, txCodeResendUrl, txCodeResendCooldown }` |
| `GET /offers/:id`                 | public        | —                                                      | `{ id, state, createdAt }`                                  |

No creation route takes a body — claim values and holder come from server state and the
verified token, not the browser.

**`POST /offers/auth-code` creates an authorization code offer** — the same DTK call as `POST /offers`
with `flow: 'authorization_code'` and no `userId` or claims. It is public because the offer is bound
to nobody until the holder signs in at the wallet. Nothing is delivered: the Embed UI reads
the offer, sees the grant, offers mobile wallets only and skips the transaction code.

**`POST /attribute-provider/claims` is the one route DTK calls**, not the browser. It authenticates
with a client-credentials token from the bank's realm, checked for its audience and client. The
backend would look the `sub` up in its customer records; here it answers `{ status: 'ok', claims }`
with the same demo customer, shaped to the KYC schema, for any holder, except that the national ID
number is the holder's `sub`, so you can then tell from the credential which account signed in at
the wallet.

**Delivery is a separate call** because who should receive the transaction code depends on which
wallet the holder picked, which the Embed UI only learns after the offer exists. The holder's `userId`
and email come from the token, not the body, and an offer created for another user is answered 404.

| `method` | Path | Who delivers                                      | What comes back                              |
| -------- | ---- | ------------------------------------------------- | -------------------------------------------- |
| `pull`   | A1   | Nobody — the wallet fetches it, keyed by `userId` | `txCodeFetchUrl` set, `txCodeResendUrl` null |
| `email`  | A2   | DTK emails the holder                             | `txCodeResendUrl` set, `txCodeFetchUrl` null |

The resend URL points at Protocol API directly — the backend has no resend route. The code expires
after three minutes, which is what the resend path is for.

**Auto-issuance is the same DTK call as `POST /offers`** with one field added,
`autoIssuance: { email, notificationModes: ['email', 'push'] }`. It doesn't return a `byReference`
for a QR code, since DTK pushes the offer straight to Pending Offers instead — notifying by email
and, best-effort, by push if the holder is signed in on mobile.

**`GET /offers/:id` is how the tenant reads the issuance result.** It is public so a signed-out
visitor can check their offer too; the id is an unguessable uuid. It returns three fields of a much
larger management-plane record; `state` is `pending` until the holder acts, then `accepted`, or one
of the other states. The demo exposes this as a **Check status** button that reads the offer once
per click. It shows only when signed in: an authorization code offer stays `pending` after
issuance, so signed out there is nothing to check.

None of those states is final: the holder accepts the offer before they can decline, and a credential can be
revoked long after issuance — the same offer can read `accepted` now and
`revoked` later. Each click reports the state as it stands at that moment.
