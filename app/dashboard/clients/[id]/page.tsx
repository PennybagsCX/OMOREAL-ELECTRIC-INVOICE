import { getClient } from '@/actions/clients'
import { getClientInvoices } from '@/actions/invoices'
import { getClientEstimates } from '@/actions/estimates'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, FileText, File } from 'lucide-react'
import Link from 'next/link'
import { DeleteButton } from './delete-button'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [client, invoices, estimates] = await Promise.all([
    getClient(id),
    getClientInvoices(id),
    getClientEstimates(id),
  ])

  if (!client) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-6 px-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">Client Details</p>
        </div>
      </div>

      {/* Client Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {client.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                {client.phone}
              </a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm whitespace-pre-line">{client.address}</p>
            </div>
          )}
          {client.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-1">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Estimates</p>
                <p className="text-2xl font-bold">{estimates?.length || 0}</p>
              </div>
              <File className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">
                  $
                  {invoices
                    ?.filter((inv: any) => inv.status !== 'paid')
                    .reduce((sum: number, inv: any) => sum + Number(inv.amount_due || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <span className="text-2xl font-bold text-orange-500">$</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      {invoices && invoices.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/invoices/new?client_id=${id}`}>New Invoice</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.slice(0, 5).map((invoice: any) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(invoice.total).toFixed(2)}</p>
                    <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Estimates */}
      {estimates && estimates.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Estimates</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/estimates/new?client_id=${id}`}>New Estimate</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estimates.slice(0, 5).map((estimate: any) => (
                <Link
                  key={estimate.id}
                  href={`/dashboard/estimates/${estimate.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{estimate.estimate_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(estimate.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(estimate.total).toFixed(2)}</p>
                    <Badge variant={estimate.status === 'accepted' ? 'success' : estimate.status === 'expired' ? 'destructive' : 'secondary'}>
                      {estimate.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link href={`/dashboard/invoices/new?client_id=${id}`}>Create Invoice</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/dashboard/estimates/new?client_id=${id}`}>Create Estimate</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/dashboard/clients/${id}/edit`}>Edit Client</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/dashboard/clients">Back to Clients</Link>
            </Button>
            <DeleteButton clientId={id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
