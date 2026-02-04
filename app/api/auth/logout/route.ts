import { signOut } from '@/actions/auth'
import { redirect } from 'next/navigation'

export async function POST() {
  await signOut()
  redirect('/login')
}
