/**
 * Sneaker Depot's catalog. Finding products is the shop's own business — UCP starts at checkout —
 * so this is a plain list. Prices are in minor units, as everywhere in a checkout.
 */

export const SHOP = { id: 'sneaker-depot', name: 'Sneaker Depot', website: 'https://sneaker-depot.example' } as const

export interface Product {
  id: string
  title: string
  price: number
  currency: string
}

const PRODUCTS: Product[] = [
  { id: 'runner-one-red', title: 'Runner One, red sneakers, size 42', price: 11900, currency: 'USD' },
  { id: 'street-low-red', title: 'Street Low, red sneakers, size 42', price: 12450, currency: 'USD' },
  { id: 'court-classic-red', title: 'Court Classic, red sneakers, size 42', price: 13900, currency: 'USD' },
  { id: 'trail-pro-blue', title: 'Trail Pro, blue sneakers, size 42', price: 9900, currency: 'USD' },
]

/** Products whose title has every word of the query (no query: all) and that cost at most `maxPrice`, cheapest first. */
export function searchProducts(query = '', maxPrice?: number): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)

  return PRODUCTS.filter((product) => words.every((word) => product.title.toLowerCase().includes(word)))
    .filter((product) => maxPrice === undefined || product.price <= maxPrice)
    .sort((a, b) => a.price - b.price)
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id)
}
