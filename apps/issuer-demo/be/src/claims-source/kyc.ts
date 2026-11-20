import type { Claims } from '../integration/types.js'

const VERIFICATION_COMPLETED_AT = '2026-08-01'
const DEMO_NATIONAL_ID_NUMBER = 'NL1234567890'

export function buildKycClaims(email: string, fullName: string, nationalIdNumber = DEMO_NATIONAL_ID_NUMBER): Claims {
  return {
    full_name: fullName,
    birth_date: '1990-04-17',
    birth_place: 'Amsterdam, NL',
    email,
    phone: '+31 20 123 4567',
    address: 'Keizersgracht 123, 1015 CJ Amsterdam',
    citizenship: 'NL',
    residence_country: 'NL',
    // One of: citizen | permanent residence permit | temporary visa
    residence_status: 'citizen',
    national_id_number: nationalIdNumber,
    tax_number: 'NL123456789',
    identity_document: {
      // One of: passport | national identity card | driver license
      type: 'passport',
      number: 'NX1234567',
      country: 'NL',
      expiration: '2031-06-09',
    },
    verification_completed_at: VERIFICATION_COMPLETED_AT,
  }
}
