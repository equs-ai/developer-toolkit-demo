# AP2 backend — the agent's side

Plays the AI assistant's part in a purchase: it shops at a stand-in shop over UCP and asks
for the user's approval through a Tenant's AP2 connector, the same MCP server a user adds to their own assistant. See
[`docs/ap2-flow.md`](../../../docs/ap2-flow.md).

## What is where

```
src/
├── server.ts       Express app and startup
├── config.ts       env vars as one typed object
├── errors.ts       the error shape every route returns
├── routes/         this demo's own HTTP surface — what the frontend calls
├── auth/           takes the signed-in user's token off the request
├── integration/    ← every call to the AP2 connector
└── merchant/       stands in for Sneaker Depot, the shop the agent buys from
```

This backend holds no DTK credential. The connector acts for the user whose token comes
with each request, exactly as it does for an AI assistant that user connected; `auth/` only passes
that token on, and the connector is the one that verifies it.

`merchant/` is the seam where a real shop would be: a catalog, and a UCP checkout with the AP2 mandate
extension, kept in memory. It signs its checkouts with a key generated at startup and publishes it in
its UCP profile. It completes a checkout only with a mandate that passes its checks, and it takes credentials
only from the issuers in `TRUSTED_ISSUERS`. Its checks are demo depth: see
[`docs/ap2-flow.md`](../../../docs/ap2-flow.md).

## The integration

| File                         | What it does                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `integration/mcpClient.ts`   | `callTool()`: one MCP tool call over Streamable HTTP, with the user's token  |
| `integration/ap2Payments.ts` | `request_payment` and `check_payment`, and the values read out of the answer |

The connector's tools answer in text written for an AI assistant. The frontend shows that text as
is; `ap2Payments.ts` reads only the payment ID, the approval link and the signed mandate out of it,
and fails on an answer it does not recognise rather than guess.

`mcpClient.ts` is written out rather than taken from an MCP client library so that the whole
exchange — `initialize`, `notifications/initialized`, `tools/call` — is readable in one file. Any
client library does the same.

## Routes

| Route                                           | Auth       | What it does                                          |
| ----------------------------------------------- | ---------- | ----------------------------------------------------- |
| `POST /payments`                                | user token | `request_payment` at the connector: the approval link |
| `GET /payments/:id?wait`                        | user token | `check_payment`: waits for the user's answer          |
| `GET /merchant/.well-known/ucp`                 | —          | The shop's UCP profile and signing key                |
| `GET /merchant/catalog?q&maxPrice`              | —          | Products matching the query, cheapest first           |
| `POST /merchant/checkout-sessions`              | —          | A UCP checkout, signed by the shop                    |
| `POST /merchant/checkout-sessions/:id/complete` | —          | Completes it with the approved checkout mandate       |

The shop's routes need no sign-in. A shop does not know who the user is, only that the
connector signed an approved mandate for its checkout.
