import { useMemo, useState } from 'react'
import {
  StellarPaymentButton,
  buildStellarPaymentUri,
  type PaymentFlowStatus,
} from 'stellar-payment-button'

const DEMO_DESTINATION = 'GCALNQQBXAPZ2WIRSDDBMSTAKCUH5SG6U76YBFLQLIXJTF7FE5AX7AOO'
const DEMO_USDC_ISSUER = 'GCRCUE2C5TBNIPYHMEP7NK5RWTT2WBSZ75CMARH7GDOHDDCQH3XANFOB'

export default function App() {
  const [status, setStatus] = useState<PaymentFlowStatus>('idle')

  const sampleUri = useMemo(
    () =>
      buildStellarPaymentUri({
        destination: DEMO_DESTINATION,
        amount: '10',
        assetCode: 'USDC',
        issuer: DEMO_USDC_ISSUER,
        memo: 'Demo order',
        msg: 'Stellar payment button demo',
      }),
    [],
  )

  return (
    <div className="app">
      <h1>stellar-payment-button</h1>
      <p className="lead">
        SEP-0007 payment URI, QR modal, copy helpers, and wallet deep link. Build the library first (
        <span className="mono">npm run build</span>
        ), then run this demo with <span className="mono">npm run demo</span> from the repo root.
      </p>

      <div className="section">
        <h2>Interactive</h2>
        <StellarPaymentButton
          destination={DEMO_DESTINATION}
          amount="25"
          assetCode="USDC"
          issuer={DEMO_USDC_ISSUER}
          memo="Order #demo"
          msg="Thank you for supporting Stellar builders"
          label="Pay 25 USDC"
          paymentStatus={status}
          onPaymentStatusChange={setStatus}
          onModalOpenChange={(open) => {
            if (open) setStatus('idle')
          }}
        />
      </div>

      <div className="section">
        <h2>Sample URI (static)</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          Generated with <span className="mono">buildStellarPaymentUri</span>
        </p>
        <div className="mono">{sampleUri}</div>
      </div>
    </div>
  )
}
