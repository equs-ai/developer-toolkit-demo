import type { Claims } from '../integration/types.js'

const LAST_SCREENED = '2026-08-01T09:30:00.000Z'

export function buildKycClaims(email: string): Claims {
  return {
    pid: {
      full_name: 'Alex Demo',
      date_of_birth: '1990-04-17',
      citizenship: 'NL',
      // One of: citizen | permanent residence permit | temporary visa
      residence_status: 'citizen',
      country_of_residence: 'NL',
      tax_number: 'NL123456789',
      // One of: passport | national identity card | driver license
      identity_document_type: 'passport',
      identity_document_number: 'NX1234567',
      identity_document_country: 'NL',
      identity_document_date: '2021-06-09',
      age_above_18: true,
      age_above_21: true,
    },
    contact_info: {
      current_address: 'Keizersgracht 123, 1015 CJ Amsterdam',
      phone_number: '+31 20 123 4567',
      // The only claim that varies per user, from the verified token.
      email,
    },
    sanctions: {
      // Each of the three: cleared | false positive resolved | match detected
      eu_consolidated_status: 'cleared',
      un_sanctions_status: 'cleared',
      ofac_sdn_status: 'cleared',
      last_checked: LAST_SCREENED,
    },
    pep: {
      // One of: not PEP | PEP domestic | PEP foreign | PEP associate
      status: 'not PEP',
      // Only meaningful when the status is not "not PEP"; N/A otherwise, per the schema's note.
      country_of_origin: 'N/A',
    },
    aml: {
      source_of_wealth_verified: true,
      // One of: Salary | Inheritance | SaleOfRealEstate | CorporateDividends | CryptoInvestments |
      // InvestmentPortfolio
      source_of_wealth_category: 'Salary',
      // One of: Cleared | NoMatch | ReviewPassed
      adverse_media_status: 'NoMatch',
      // One of: High | Medium | Low
      risk_category: 'Low',
      screening_done: LAST_SCREENED,
    },
  }
}
