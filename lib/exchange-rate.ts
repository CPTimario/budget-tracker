'use server'

export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
  if (!res.ok) throw new Error(`Failed to fetch exchange rate: ${res.status}`)
  const data = await res.json()
  const rate = data.rates?.[to]
  if (!rate) throw new Error(`No rate found for ${from} → ${to}`)
  return rate
}
