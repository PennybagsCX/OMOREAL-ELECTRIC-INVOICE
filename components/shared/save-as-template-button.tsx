'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText } from 'lucide-react'
import { createTemplateFromEstimate, createTemplateFromInvoice } from '@/actions/estimate-invoice-templates'
import { toast } from '@/hooks/use-toast'

interface SaveAsTemplateButtonProps {
  id: string
  type: 'estimate' | 'invoice'
}

export function SaveAsTemplateButton({ id, type }: SaveAsTemplateButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      if (type === 'estimate') {
        await createTemplateFromEstimate(id, name, description || undefined)
      } else {
        await createTemplateFromInvoice(id, name, description || undefined)
      }
      toast({ title: 'Success', description: `Template saved!` })
      setOpen(false)
      setName('')
      setDescription('')
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save template', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Save as Template</span>
          <span className="sm:hidden">Template</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this {type} as a reusable template. You can load it when creating new {type}s.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Residential Service Call"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description (Optional)</Label>
            <Textarea
              id="template-description"
              placeholder="Brief description of this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
