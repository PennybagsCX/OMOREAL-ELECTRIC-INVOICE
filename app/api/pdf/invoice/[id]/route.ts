import { createClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/actions/pdf'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  return generateInvoicePDF(id)
}
