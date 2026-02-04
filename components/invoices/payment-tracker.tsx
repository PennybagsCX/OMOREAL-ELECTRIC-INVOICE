'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createPayment, deletePayment } from '@/actions/payments'
import { toast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  payment_method: string | null
  payment_date: string
  notes: string | null
  transaction_id: string | null
}

interface PaymentTrackerProps {
  invoiceId: string
  payments: Payment[]
  amountPaid: number
  amountDue: number
}

export function PaymentTracker({ invoiceId, payments, amountPaid, amountDue }: PaymentTrackerProps) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleAddPayment(formData: FormData) {
    setLoading(true)
    try {
      await createPayment(formData)
      toast({ title: 'Success', description: 'Payment added!' })
      setShowForm(false)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePayment(paymentId: string) {
    setLoading(true)
    try {
      await deletePayment(paymentId, invoiceId)
      toast({ title: 'Success', description: 'Payment deleted!' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">${(amountPaid + amountDue).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-600">${amountPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due</p>
              <p className="text-2xl font-bold text-orange-600">${amountDue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full">
          Add Payment
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Add a payment to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleAddPayment} className="space-y-4">
              <input type="hidden" name="invoice_id" value={invoiceId} />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Date</Label>
                  <Input
                    id="payment_date"
                    name="payment_date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select name="payment_method">
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction ID</Label>
                  <Input id="transaction_id" name="transaction_id" placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Payment notes..." />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Payment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {payment.payment_method || '-'}
                      {payment.transaction_id && (
                        <span className="text-xs text-muted-foreground block">
                          {payment.transaction_id}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePayment(payment.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
