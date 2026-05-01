# stellar-payment-button

React payment button for the Stellar network: builds [SEP-0007](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md) `web+stellar:pay` URIs, shows a QR modal, copies payment details, and opens the user’s Stellar wallet (including [Scopuly](https://scopuly.com/) and other SEP-7–compatible wallets).

## Install

```bash
npm install stellar-payment-button
```

Peer dependencies: **React 18+** and **React DOM 18+**. `@stellar/stellar-base` is installed automatically as a dependency.

## Usage

Import styles once (either entry or explicit stylesheet):

```tsx
import { StellarPaymentButton } from 'stellar-payment-button'
import 'stellar-payment-button/styles.css'

export function Checkout() {
  return (
    <StellarPaymentButton
      destination="G…"
      amount="10"
      assetCode="USDC"
      issuer="G…"
      memo="Order #1024"
      msg="Shown in the wallet UI (not on-chain)"
      label="Pay 10 USDC"
      network="public"
    />
  )
}
```

### Helpers

```ts
import {
  buildStellarPaymentUri,
  formatPaymentSummary,
  STELLAR_NETWORK_PASSPHRASE,
} from 'stellar-payment-button'
```

Use `network="testnet"` or pass `networkPassphrase` for non-public networks.

### Props highlights

| Area | Notes |
|------|--------|
| `preferModal` | Default `true`: opens QR/details modal; set `false` to navigate straight to `web+stellar:…`. |
| `paymentStatus` | Optional controlled UI: `idle` \| `pending` \| `success` \| `failed`. |
| `className` / `buttonClassName` | Wrapper vs. primary button classes. |

Tailwind classes in the library use the **`spb-`** prefix to reduce clashes with host apps.

## Demo

From the repo root:

```bash
npm install
npm run demo
```

Opens the Vite demo (default port **5174**). Run `npm run build` first if you changed the library source.

## Scripts

| Script | Purpose |
|--------|--------|
| `npm run build` | Production library build → `dist/` |
| `npm run demo` | Build library + run example app |
| `npm run demo:build` | Build library + static demo build |

`dist/` is gitignored; publish or consume from npm after `npm run build`.

## License

MIT — see [LICENSE](./LICENSE).
