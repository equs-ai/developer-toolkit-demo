/**
 * What the guide suggests sending in a real assistant. The agent picks the kind of approval from the
 * words. The shop has no connector: it is a UCP service, so the prompt says where its profile is.
 */
export const guidePrompts = (connectorName: string, shopUcpUrl: string) => [
  {
    title: 'One purchase',
    text: `Sneaker Depot is a UCP shop, its profile is at ${shopUcpUrl}. Find the cheapest red sneakers under 130 USD there and buy them with my ${connectorName} connector. Ship to Ada Issuer, 1 Demo St. Wait until I approve it in my wallet, then complete the checkout and tell me the order number.`,
  },
  {
    title: 'A budget for the assistant',
    text: `Sneaker Depot is a UCP shop, its profile is at ${shopUcpUrl}. You may spend up to 200 USD there. Get my approval for that budget once through my ${connectorName} connector, then pick a pair of sneakers, buy it, and tell me the order number. Ship to Ada Issuer, 1 Demo St.`,
  },
]
