# Issuer flow

Acme Bank issues a KYC credential to an existing customer, two ways.

Sign-in is real: the site redirects to the tenant's own Keycloak (BYOIdP), and the backend verifies
the token on every route. `sub` binds the offer to the holder and `email` becomes the credential's
Contact Info claim.

The bank's page also tells the user to log in to the Mobile Wallet with the same credentials, under
the tenant **slug** — needed on first sign-in.

## A. Issue KYC VC to any Wallet

The user picks a wallet in the Embed UI.

**A1 — EQUS Mobile Wallet.** A QR code appears. They scan it and accept the credential; the wallet
fetches the transaction code itself, so there is nothing to input.

**A2 — Other Wallet.** A transaction code is emailed to the address they signed in with. A QR code
appears; they scan it, enter the code, and accept the credential.

A browser-based Web Custodial Wallet is also available as a wallet option, but it is not enabled in
this demo; tenants who want it must contact EQUS.

## B. Auto-issue KYC VC to EQUS Wallet

No QR code (the user needs to be signed in to the issuer's ExtIdp for this to work). The offer is
pushed to the user's EQUS wallet — email, plus a push notification if they are signed in on mobile are sent.
They open the wallet and accept from their pending offers.

In this demo a button triggers it, but nothing about the flow requires user interaction; a real
tenant would fire it from their own business logic.

## The backend's HTTP surface

Four routes, all of them behind a Bearer token from the tenant's external Keycloak. The backend
verifies that token via JWKS and keeps no session of its own.

| Route                       | Request         | Response                                                    |
| --------------------------- | --------------- | ----------------------------------------------------------- |
| `POST /offers`              | _no body_       | `{ uriId, byReference }`                                    |
| `POST /offers/auto`         | _no body_       | `{ uriId }`                                                 |
| `POST /offers/:id/delivery` | `{ method, … }` | `{ txCodeFetchUrl, txCodeResendUrl, txCodeResendCooldown }` |
| `GET /offers/:id`           | —               | `{ id, state, createdAt }`                                  |

Neither creation route takes a body — claim values and holder come from server state and the
verified token, not the browser.

**Delivery is a separate call** because who should receive the transaction code depends on which
wallet the holder picked, which the Embed UI only learns after the offer exists.

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

**`GET /offers/:id` is how the tenant reads the issuance result.** It returns three fields of a much
larger management-plane record; `state` is `pending` until the holder acts, then `accepted`, or one
of the other states. The demo exposes this as a **Check status** button that reads the offer once
per click.

None of those states is final: the holder accepts the offer before they can decline, and a credential can be
revoked long after issuance — the same offer can read `accepted` now and
`revoked` later. Each click reports the state as it stands at that moment.
