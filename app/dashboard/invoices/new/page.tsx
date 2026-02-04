import { getClients } from '@/actions/clients'
import NewInvoiceForm from './form'

export default async function NewInvoicePage() {
  const clients = await getClients()

  return <NewInvoiceForm clients={clients || []} />
}
