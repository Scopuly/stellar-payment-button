import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from 'react'
import QRCode from 'react-qr-code'
import {
  buildStellarPaymentUri,
  formatPaymentSummary,
  STELLAR_NETWORK_PASSPHRASE,
  type BuildStellarPaymentUriOptions,
  type StellarPaymentNetwork,
} from './payment-uri'

export type PaymentFlowStatus = 'idle' | 'pending' | 'success' | 'failed'

export interface StellarPaymentButtonProps
  extends BuildStellarPaymentUriOptions,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'className'> {
  /** Main button label */
  label?: string
  /** Applied to the outer wrapper */
  className?: string
  /** Applied to the `<button>` element */
  buttonClassName?: string
  /** Shortcut for `networkPassphrase` */
  network?: StellarPaymentNetwork
  /** Controlled payment lifecycle for checkout flows */
  paymentStatus?: PaymentFlowStatus
  /** Shown when paymentStatus is failed (or overrides default copy) */
  statusMessage?: string
  paymentStatusLabelPending?: string
  paymentStatusLabelSuccess?: string
  paymentStatusLabelFailed?: string
  qrSize?: number
  modalTitle?: string
  /** Called after the SEP-0007 URI changes */
  onUriBuilt?: (uri: string) => void
  onModalOpenChange?: (open: boolean) => void
  onPaymentStatusChange?: (status: PaymentFlowStatus) => void
  /** Opens modal instead of navigating directly */
  preferModal?: boolean
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export function StellarPaymentButton({
  label = 'Pay with Stellar',
  network,
  paymentStatus = 'idle',
  statusMessage,
  paymentStatusLabelPending = 'Awaiting payment…',
  paymentStatusLabelSuccess = 'Payment received',
  paymentStatusLabelFailed = 'Payment failed',
  qrSize = 192,
  modalTitle = 'Pay with Stellar',
  onUriBuilt,
  onModalOpenChange,
  onPaymentStatusChange,
  preferModal = true,
  destination,
  amount,
  assetCode,
  issuer,
  memo,
  memoType,
  msg,
  networkPassphrase,
  className,
  buttonClassName,
  disabled,
  onClick,
  ...buttonProps
}: StellarPaymentButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  const [open, setOpen] = useState(false)
  const [copyHint, setCopyHint] = useState<'uri' | 'details' | null>(null)

  const passphrase =
    networkPassphrase ??
    (network === 'testnet' ? STELLAR_NETWORK_PASSPHRASE.testnet : undefined)

  const uriOptions = useMemo(
    () =>
      ({
        destination,
        amount,
        assetCode,
        issuer,
        memo,
        memoType,
        msg,
        networkPassphrase: passphrase,
      }) satisfies BuildStellarPaymentUriOptions,
    [destination, amount, assetCode, issuer, memo, memoType, msg, passphrase],
  )

  const stellarUri = useMemo(() => buildStellarPaymentUri(uriOptions), [uriOptions])

  useEffect(() => {
    onUriBuilt?.(stellarUri)
  }, [stellarUri, onUriBuilt])

  const summary = useMemo(
    () => formatPaymentSummary(uriOptions, stellarUri),
    [uriOptions, stellarUri],
  )

  const detailsText = useMemo(() => summary.lines.join('\n'), [summary.lines])

  const setModal = useCallback(
    (next: boolean) => {
      setOpen(next)
      onModalOpenChange?.(next)
    },
    [onModalOpenChange],
  )

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open])

  const flashCopied = useCallback((kind: 'uri' | 'details') => {
    setCopyHint(kind)
    window.setTimeout(() => setCopyHint(null), 1600)
  }, [])

  const handleCopyUri = useCallback(async () => {
    if (await copyText(stellarUri)) flashCopied('uri')
  }, [flashCopied, stellarUri])

  const handleCopyDetails = useCallback(async () => {
    if (await copyText(detailsText)) flashCopied('details')
  }, [detailsText, flashCopied])

  const statusBadge = () => {
    if (paymentStatus === 'idle') return null
    const base =
      'spb-inline-flex spb-items-center spb-rounded-full spb-px-2.5 spb-py-0.5 spb-text-xs spb-font-medium'
    if (paymentStatus === 'pending') {
      return (
        <span className={`${base} spb-bg-amber-500/15 spb-text-amber-200`}>
          {paymentStatusLabelPending}
        </span>
      )
    }
    if (paymentStatus === 'success') {
      return (
        <span className={`${base} spb-bg-emerald-500/15 spb-text-emerald-200`}>
          {paymentStatusLabelSuccess}
        </span>
      )
    }
    return (
      <span className={`${base} spb-bg-rose-500/15 spb-text-rose-200`}>
        {paymentStatusLabelFailed}
        {statusMessage ? ` — ${statusMessage}` : ''}
      </span>
    )
  }

  const launchWallet = () => {
    window.location.href = stellarUri
  }

  const handlePrimaryClick = (_event: MouseEvent<HTMLButtonElement>) => {
    if (preferModal) {
      setModal(true)
      return
    }
    launchWallet()
  }

  const emitStatus = (next: PaymentFlowStatus) => {
    onPaymentStatusChange?.(next)
  }

  return (
    <div className={`spb-font-sans ${className ?? ''}`}>
      <div className="spb-flex spb-flex-wrap spb-items-center spb-gap-3">
        <button
          type="button"
          {...buttonProps}
          disabled={disabled}
          onClick={(e) => {
            onClick?.(e)
            if (!e.defaultPrevented) handlePrimaryClick(e)
          }}
          className={`spb-inline-flex spb-items-center spb-justify-center spb-rounded-xl spb-bg-gradient-to-r spb-from-violet-600 spb-to-indigo-600 spb-px-5 spb-py-2.5 spb-text-sm spb-font-semibold spb-text-white spb-shadow-lg spb-shadow-indigo-900/40 spb-transition hover:spb-from-violet-500 hover:spb-to-indigo-500 focus-visible:spb-outline focus-visible:spb-outline-2 focus-visible:spb-outline-offset-2 focus-visible:spb-outline-indigo-300 disabled:spb-cursor-not-allowed disabled:spb-opacity-50 ${buttonClassName ?? ''}`}
        >
          {label}
        </button>
        {statusBadge()}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="spb-w-[calc(100vw-2rem)] spb-max-w-md spb-rounded-2xl spb-border spb-border-white/10 spb-bg-slate-950 spb-p-0 spb-text-slate-100 spb-shadow-2xl spb-[&::backdrop]:spb-bg-black/70"
        onCancel={(e) => {
          e.preventDefault()
          setModal(false)
        }}
      >
        <div className="spb-flex spb-max-h-[min(90vh,720px)] spb-flex-col">
          <header className="spb-flex spb-items-start spb-justify-between spb-gap-3 spb-border-b spb-border-white/10 spb-px-5 spb-py-4">
            <div>
              <h2 id={titleId} className="spb-text-lg spb-font-semibold">
                {modalTitle}
              </h2>
              <p id={descId} className="spb-mt-1 spb-text-sm spb-text-slate-400">
                Scan the QR or open the link in a Stellar wallet (SEP-0007).{' '}
                <span className="spb-whitespace-nowrap">Works with Scopuly and others.</span>
              </p>
            </div>
            <button
              type="button"
              className="spb-rounded-lg spb-p-1 spb-text-slate-400 spb-transition hover:spb-bg-white/5 hover:spb-text-white"
              aria-label="Close"
              onClick={() => setModal(false)}
            >
              ✕
            </button>
          </header>

          <div className="spb-flex-1 spb-overflow-y-auto spb-px-5 spb-py-4">
            <div className="spb-flex spb-flex-col spb-items-center spb-gap-4">
              <div className="spb-rounded-2xl spb-bg-white spb-p-3">
                <QRCode value={stellarUri} size={qrSize} />
              </div>

              <div className="spb-w-full spb-rounded-xl spb-bg-slate-900 spb-p-3 spb-font-mono spb-text-xs spb-break-all spb-text-slate-300">
                {stellarUri}
              </div>

              <div className="spb-flex spb-w-full spb-flex-col spb-gap-2 sm:spb-flex-row">
                <button
                  type="button"
                  className="spb-flex-1 spb-rounded-xl spb-bg-white spb-px-4 spb-py-2.5 spb-text-sm spb-font-semibold spb-text-slate-900 spb-transition hover:spb-bg-slate-100"
                  onClick={() => {
                    emitStatus('pending')
                    launchWallet()
                  }}
                >
                  Open in wallet
                </button>
                <button
                  type="button"
                  className="spb-flex-1 spb-rounded-xl spb-border spb-border-white/15 spb-bg-transparent spb-px-4 spb-py-2.5 spb-text-sm spb-font-semibold spb-text-white spb-transition hover:spb-bg-white/5"
                  onClick={handleCopyUri}
                >
                  {copyHint === 'uri' ? 'Copied URI' : 'Copy URI'}
                </button>
              </div>

              <button
                type="button"
                className="spb-w-full spb-rounded-xl spb-border spb-border-dashed spb-border-white/20 spb-bg-transparent spb-px-4 spb-py-2 spb-text-sm spb-text-slate-300 hover:spb-bg-white/5"
                onClick={handleCopyDetails}
              >
                {copyHint === 'details' ? 'Copied details' : 'Copy payment details'}
              </button>

              <div className="spb-w-full spb-rounded-xl spb-bg-slate-900/80 spb-p-3 spb-text-left spb-text-xs spb-leading-relaxed spb-text-slate-400">
                {summary.lines.slice(0, -3).map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>

              <div className="spb-flex spb-w-full spb-gap-2 spb-border-t spb-border-white/10 spb-pt-4">
                <button
                  type="button"
                  className="spb-flex-1 spb-rounded-xl spb-bg-emerald-600 spb-py-2 spb-text-sm spb-font-semibold spb-text-white hover:spb-bg-emerald-500"
                  onClick={() => emitStatus('success')}
                >
                  Mark paid (demo)
                </button>
                <button
                  type="button"
                  className="spb-flex-1 spb-rounded-xl spb-border spb-border-white/15 spb-py-2 spb-text-sm spb-font-semibold spb-text-slate-200 hover:spb-bg-white/5"
                  onClick={() => emitStatus('failed')}
                >
                  Mark failed (demo)
                </button>
              </div>
              <p className="spb-text-center spb-text-[11px] spb-text-slate-500">
                Production apps should verify payments on Horizon / RPC instead of manual buttons.
              </p>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
