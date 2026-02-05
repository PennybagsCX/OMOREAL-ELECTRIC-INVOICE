'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

export default function TeamPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('You must be logged in to invite team members')
        }
        throw new Error('Failed to send invite')
      }

      toast({ title: 'Success', description: 'Invitation sent!' })
      setEmail('')
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-8 px-4 w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Invite team members to collaborate</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4 w-full overflow-x-hidden">
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 w-full overflow-x-hidden">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                  <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
