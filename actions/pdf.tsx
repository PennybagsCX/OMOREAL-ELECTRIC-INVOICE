'use server'

import { createClient } from '@/lib/supabase/server'
import { EstimatePDF, InvoicePDF } from '@/lib/utils/pdf'
import { pdf } from '@react-pdf/renderer'

export async function generateEstimatePDF(estimateId: string) {
  const supabase = await createClient()

  const { data: estimate } = await supabase
    .from('estimates')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', estimateId)
    .single()

  if (!estimate) throw new Error('Estimate not found')

  // Get business profile
  const { data: business } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1)
    .single()

  const doc = <EstimatePDF estimate={estimate} client={estimate.client} business={business} />
  const pdfBlob = await pdf(doc).toBlob()
  const pdfArrayBuffer = await pdfBlob.arrayBuffer()

  return new Response(pdfArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${estimate.estimate_number}.pdf"`,
    },
  })
}

export async function generateInvoicePDF(invoiceId: string) {
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', invoiceId)
    .single()

  if (!invoice) throw new Error('Invoice not found')

  // Get business profile
  const { data: business } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1)
    .single()

  const doc = <InvoicePDF invoice={invoice} client={invoice.client} business={business} />
  const pdfBlob = await pdf(doc).toBlob()
  const pdfArrayBuffer = await pdfBlob.arrayBuffer()

  return new Response(pdfArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
