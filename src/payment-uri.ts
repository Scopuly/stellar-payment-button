import { Networks, StrKey } from '@stellar/stellar-base'

export const STELLAR_NETWORK_PASSPHRASE = {
  public: Networks.PUBLIC,
  testnet: Networks.TESTNET,
} as const

export type StellarPaymentNetwork = keyof typeof STELLAR_NETWORK_PASSPHRASE

/** SEP-0007 memo types for `pay` operation */
export type MemoTypeSep7 = 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN'

export interface BuildStellarPaymentUriOptions {
  /** Stellar account (G…) or federated payment address */
  destination: string
  /** Omit or empty for “pay what you want” flows */
  amount?: string
  /** Omit, `XLM`, or `native` for lumens */
  assetCode?: string
  /** Required when paying a non-native asset */
  issuer?: string
  memo?: string
  memoType?: MemoTypeSep7
  /** Shown in the wallet UI only (not on-chain). Max ~300 chars before encoding */
  msg?: string
  /** Defaults to public mainnet when omitted */
  networkPassphrase?: string
}

const ACCOUNT_LIKE = /^G[A-Z2-7]{55}$/

function assertPublicKeyField(value: string, field: string): void {
  if (!ACCOUNT_LIKE.test(value)) return
  if (!StrKey.isValidEd25519PublicKey(value)) {
    throw new Error(`${field} is not a valid Stellar account id`)
  }
}

/**
 * Builds a `web+stellar:pay?…` URI per [SEP-0007](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md).
 */
export function buildStellarPaymentUri(options: BuildStellarPaymentUriOptions): string {
  const {
    destination,
    amount,
    assetCode,
    issuer,
    memo,
    memoType,
    msg,
    networkPassphrase,
  } = options

  assertPublicKeyField(destination, 'destination')

  const params = new URLSearchParams()
  params.set('destination', destination)

  if (amount !== undefined && amount !== '') {
    params.set('amount', amount)
  }

  const code = assetCode?.trim()
  const isNative =
    !code ||
    code.toUpperCase() === 'XLM' ||
    code.toLowerCase() === 'native'

  if (!isNative) {
    params.set('asset_code', code)
    if (!issuer?.trim()) {
      throw new Error('issuer is required when assetCode is not native/XLM')
    }
    assertPublicKeyField(issuer.trim(), 'issuer')
    params.set('asset_issuer', issuer.trim())
  }

  if (memo !== undefined && memo !== '') {
    params.set('memo', memo)
    params.set('memo_type', memoType ?? 'MEMO_TEXT')
  }

  if (msg?.trim()) {
    params.set('msg', msg.trim())
  }

  if (networkPassphrase !== undefined && networkPassphrase !== '') {
    params.set('network_passphrase', networkPassphrase)
  }

  return `web+stellar:pay?${params.toString()}`
}

export interface PaymentSummaryLines {
  title: string
  lines: string[]
}

export function formatPaymentSummary(
  options: BuildStellarPaymentUriOptions,
  stellarUri: string,
): PaymentSummaryLines {
  const code = options.assetCode?.trim()
  const isNative =
    !code ||
    code.toUpperCase() === 'XLM' ||
    code.toLowerCase() === 'native'

  const assetLabel = isNative ? 'XLM' : `${code}${options.issuer ? ` (${options.issuer.slice(0, 8)}…)` : ''}`

  const lines: string[] = [
    `To: ${options.destination}`,
    options.amount ? `Amount: ${options.amount} ${assetLabel}` : `Amount: (open in wallet) ${assetLabel}`,
  ]

  if (options.memo) lines.push(`Memo (${options.memoType ?? 'MEMO_TEXT'}): ${options.memo}`)
  if (options.msg) lines.push(`Note: ${options.msg}`)
  lines.push('')
  lines.push('SEP-0007 URI:', stellarUri)

  return {
    title: `Pay ${options.amount ? `${options.amount} ${assetLabel}` : assetLabel}`,
    lines,
  }
}
