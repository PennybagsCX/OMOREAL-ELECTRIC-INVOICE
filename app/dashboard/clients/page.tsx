'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(() => setClients([]))
  }, [])

  return (
    <div className="container py-8 px-4 w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button asChild>
          <Link href="/dashboard/clients/new">Add Client</Link>
        </Button>
      </div>

      {clients?.length === 0 ? (
        <p className="text-muted-foreground">No clients yet. Add your first client!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients?.map((client) => (
            <Card key={client.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold">{client.name}</h3>
                {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                <Button asChild variant="link" className="p-0 mt-2">
                  <Link href={`/dashboard/clients/${client.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
