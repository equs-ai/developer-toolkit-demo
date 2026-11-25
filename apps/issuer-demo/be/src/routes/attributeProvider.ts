import { Router } from 'express'
import { z } from 'zod'
import { requireAttributeProviderCaller } from '../auth/serviceToken.js'
import { buildKycClaims } from '../claims-source/kyc.js'

export const attributeProviderRouter = Router()

// The same demo customer for every holder: the bank's customer records are out of scope here.
const DEMO_CUSTOMER = { email: 'jane.doe@example.com', name: 'Jane Doe' }

const resolveClaimsBody = z.object({
  sub: z.string().min(1),
  credentialIssuer: z.string().url(),
  credentialConfigurationId: z.string().min(1),
})

// DTK calls this while issuing an authorization code offer, for the holder who signed in at the wallet.
// It answers { status: 'ok', credentialConfigurationId, claims } or { status: 'denied', reason }; DTK
// keeps only the claims the credential's schema declares.
attributeProviderRouter.post('/attribute-provider/claims', requireAttributeProviderCaller, async (req, res) => {
  const { sub, credentialConfigurationId } = resolveClaimsBody.parse(req.body)
  const requestId = req.header('x-request-id')

  console.log(`Attribute Provider: resolved claims for ${credentialConfigurationId} (request ${requestId ?? 'n/a'})`)
  res.json({ status: 'ok', credentialConfigurationId, claims: buildKycClaims(DEMO_CUSTOMER.email, DEMO_CUSTOMER.name, sub) })
})
