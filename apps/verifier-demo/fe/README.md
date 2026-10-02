# Verifier frontend — Mortgage HUB

A mortgage applicant evidences their KYC status by presenting a credential from their wallet
instead of uploading documents. There are no accounts and no sign-in.

## What is where

```
src/
├── main.tsx        mounts App
├── App.tsx         composition: boots the Embed UI, hands the flow to the panel
├── integration/    ← every line of DTK code
├── app/            this demo's own wiring
└── ui/             presentation only
```

`app/` holds `config.ts` (the `VITE_*` env vars as one typed object), `backendApi.ts` (the two calls
to this demo's own backend) and `types.ts` (the shapes they exchange, plus `VerifyKycCallbacks`).

`ui/` is the Mortgage HUB website. It takes plain data and plain handlers as props and imports
nothing from `integration/`. The status state for the button lives in
`ui/VerifyPanel.tsx`, next to the copy that renders it.

If you are reading this repo to learn the integration, `src/integration/` and
[`../be/README.md`](../be/README.md) are the whole story on the verifier side.

## The integration

| File                           | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `integration/useEmbeddedUi.ts` | The single `initEmbeddedUi()` / `cleanUpEmbeddedUi()` pair |
| `integration/verifyKyc.ts`     | The whole verification flow, via `presentVCs()`            |

The pair is called from a mount effect rather than at module load. That is the only place the
cleanup can be hung, and it is what makes React StrictMode's init → destroy → init cycle
survivable.

On click, `verifyKyc()` calls `presentVCs()` with `onVerified` / `onRejected` / `onError` callbacks,
passing `onRejected` and `onError` straight through. `presentVCs()` awaits the `getReqUriAndTxId`
callback (`POST /requests`, returning `{ web, mobile, dc }` unchanged), opens the Embed UI in an
iframe for the user to pick a wallet, and calls `onSuccess` with `{ authResponse, txId }` once the
wallet responds. `verifyKyc()` then calls `POST /verify` with `{ authResponse, txId, origin }`,
calling `onVerified(verifiedClaims)` on success or `onError` otherwise.

Those two routes are the whole of what this frontend owes its backend — see
[`docs/verifier-flow.md`](../../../docs/verifier-flow.md).

## Keeping the UI in sync with the request

`ui/VerifyPanel.tsx` marks itself pending the moment `verifyKyc()` is called, and clears that status
as soon as `onVerified`, `onRejected`, or `onError` fires. It also carries a dismiss action
("Start over" / "Reset") so the user has a way out of the pending state on their own — for example
after closing the Embed UI iframe without the wallet ever responding. Dismissing only resets this
page; the request itself keeps running until it expires.

## Reading order

`app/config.ts` → `integration/useEmbeddedUi.ts` → `integration/verifyKyc.ts` → `app/backendApi.ts`.
