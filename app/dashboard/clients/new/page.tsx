import { createClientAction } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

export default function NewClientPage() {
  return (
    <div className="container max-w-2xl py-8 px-4 w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Add New Client</CardTitle>
          <CardDescription>Enter client information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-4 w-full overflow-x-hidden">
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <Button type="submit">Create Client</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
