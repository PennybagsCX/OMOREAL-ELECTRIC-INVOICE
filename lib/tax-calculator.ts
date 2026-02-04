export interface TaxCalculation {
  taxable_subtotal: number
  exempt_subtotal: number
  total_tax: number
  subtotal: number
  total: number
}

/**
 * Calculate tax breakdown from line items
 * Separates taxable and exempt items, then calculates totals
 */
export function calculateTaxFromLineItems(lineItems: any[]): TaxCalculation {
  let taxable_subtotal = 0
  let exempt_subtotal = 0
  let total_tax = 0

  lineItems.forEach(item => {
    const itemTaxRate = item.tax_rate ?? 13 // Default to 13% for backward compatibility
    const itemAmount = Number(item.quantity) * Number(item.rate)

    if (itemTaxRate === 0) {
      exempt_subtotal += itemAmount
    } else {
      taxable_subtotal += itemAmount
      total_tax += itemAmount * (itemTaxRate / 100)
    }
  })

  const subtotal = taxable_subtotal + exempt_subtotal
  const total = subtotal + total_tax

  return {
    taxable_subtotal,
    exempt_subtotal,
    total_tax,
    subtotal,
    total,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}
