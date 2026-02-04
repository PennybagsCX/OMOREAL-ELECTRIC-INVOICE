'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBusinessProfile() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertBusinessProfile(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    address: formData.get('address') as string || null,
    website: formData.get('website') as string || null,
    tax_id: formData.get('tax_id') as string || null,
    logo_url: formData.get('logo_url') as string || null,
  }

  const { error } = await supabase
    .from('business_profiles')
    .upsert(data, { onConflict: 'id' })

  if (error) throw error
  revalidatePath('/dashboard/settings')
}
