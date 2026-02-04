import { getInvoice } from '@/actions/invoices'
import { getClients } from '@/actions/clients'
import { notFound } from 'next/navigation'
import EditInvoiceForm from './form'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [invoice, clients] = await Promise.all([
    getInvoice(id),
    getClients(),
  ])

  if (!invoice) {
    notFound()
  }

  return <EditInvoiceForm invoice={invoice} clients={clients || []} />
}
