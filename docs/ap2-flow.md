# AP2 flow

An AI assistant shops for the user and buys only with an approval the user gives in their wallet. A
Tenant on DTK offers an AP2 connector — an MCP server — that the user adds to their assistant once. The
connector turns the agent's request into a mandate the user approves by presenting their KYC
credential, and hands the agent the signed mandate for the shop. The demo moves no money: settling the
payment is out of its scope.

The demo page shows this twice: as a scripted chat whose calls are real requests, and as a guide to
running it in Claude.

## One purchase

1. The user asks the assistant to buy something.
2. The assistant finds a product and opens a UCP checkout at the shop, which signs it
   (`ap2.merchant_authorization`).
3. The assistant calls `request_payment` on the connector with that signed checkout. The connector
   answers with a link to its approval page.
4. The user opens the link, signs in and presents their KYC credential from their wallet.
5. The assistant calls `check_payment`, which waits for the user's answer and returns the signed
   checkout mandate once they approve.
6. The assistant completes the checkout with that mandate (`ap2.checkout_mandate`). The shop checks the
   mandate before it ships: that the credential comes from an issuer it trusts and is of the type the
   mandate names as its payment instrument, the signatures from the credential to the user, and that
   the mandate covers this checkout and no other.

## Who does what

| Part                              | Where it lives             | In this repo               |
| --------------------------------- | -------------------------- | -------------------------- |
| The AI assistant                  | The user's own             | The scripted chat plays it |
| The Tenant's AP2 connector        | DTK                        | Called, not implemented    |
| The approval page                 | DTK, on the connector      | Linked to, not implemented |
| The wallet and the KYC credential | The user's EQUS wallet     | —                          |
| The shop                          | The shop's own UCP service | Sneaker Depot, a stand-in  |

## The backend's HTTP surface

The payment routes take the user's own access token and pass it to the connector, which acts as that
user. The shop's routes take none. See [`be/README.md`](../apps/ap2-demo/be/README.md).

## What the stand-in shop does not do yet

- **Sign the UCP way.** UCP signs the checkout body as a detached JWS; the stand-in signs a compact JWT
  carrying the checkout's terms, which is what the connector reads.
- **Check every limit of a budget.** For an approved budget the shop checks the amount, the currency, the
  payee and the merchant. It does not evaluate the approved items or unknown constraints, and it leaves
  using a budget only once to the connector.

## What the chat does not play yet

**A budget for the assistant.** The connector also lets the user approve a spending limit once
(`request_mandate`) for the assistant to buy within. The guide suggests it; the chat plays only the
one purchase.
