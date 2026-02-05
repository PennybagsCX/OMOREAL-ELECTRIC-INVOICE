import { getClients } from '@/actions/clients'
import NewInvoiceForm from './form'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const clients = await getClients()
  const params = await searchParams

  console.log('📄 New Invoice Page:', {
    client_id: params.client_id,
    clientsCount: clients?.length,
    clientIds: clients?.map(c => ({ id: c.id, name: c.name }))
  })

  return <NewInvoiceForm clients={clients || []} preselectedClientId={params.client_id} />
}
