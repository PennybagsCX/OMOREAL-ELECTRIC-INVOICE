import { getClients } from '@/actions/clients'
import NewInvoiceForm from './form'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const clients = await getClients()
  const params = await searchParams

  return <NewInvoiceForm clients={clients || []} preselectedClientId={params.client_id} />
}
