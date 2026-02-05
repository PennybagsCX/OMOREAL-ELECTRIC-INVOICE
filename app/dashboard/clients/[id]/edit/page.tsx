import { getClient } from '@/actions/clients'
import { updateClient } from '@/actions/clients'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) {
    notFound()
  }

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateClient(id, formData)
    revalidatePath(`/dashboard/clients/${id}`)
    redirect(`/dashboard/clients/${id}`)
  }

  return (
    <div className="container max-w-2xl py-8 px-4 w-full overflow-x-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/clients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Client</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
          <CardDescription>Update client information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-4 w-full overflow-x-hidden">
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={client.name || ''}
              />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client.email || ''}
              />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client.phone || ''}
              />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={client.address || ''}
              />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client.notes || ''}
              />
            </div>
            <Button type="submit">Update Client</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
