'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { upsertBusinessProfile, getBusinessProfile } from '@/actions/business-profile'
import { toast } from '@/hooks/use-toast'
import { Upload, X, Image as ImageIcon, FileText, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tax_id: '',
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getBusinessProfile()
        if (data) {
          setProfile({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            website: data.website || '',
            tax_id: data.tax_id || '',
          })
          if (data.logo_url) {
            setLogoUrl(data.logo_url)
            setLogoPreview(data.logo_url)
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    try {
      formData.append('logo_url', logoUrl)
      await upsertBusinessProfile(formData)
      toast({ title: 'Success', description: 'Settings saved!' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload JPEG, PNG, GIF, or WebP image', variant: 'destructive' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File too large. Maximum size is 5MB', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setLogoUrl(data.url)
      setLogoPreview(data.url)
      toast({ title: 'Success', description: 'Logo uploaded!' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveLogo() {
    setLogoUrl('')
    setLogoPreview('')
    toast({ title: 'Removed', description: 'Logo removed' })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container max-w-2xl py-8 px-4 w-full overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Your business information appears on estimates and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6 w-full overflow-x-hidden">
            {/* Logo Upload */}
            <div className="space-y-2 w-full">
              <Label>Business Logo</Label>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 w-full">
                {logoPreview ? (
                  <div className="relative group shrink-0">
                    <img
                      src={logoPreview}
                      alt="Business logo preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/20 shrink-0">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2 min-w-0">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2 shrink-0" />
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                  <p className="text-xs text-muted-foreground break-words">
                    JPEG, PNG, GIF, or WebP (max 5MB)<br />
                    Recommended: Square logo, at least 200x200px
                  </p>
                  {logoUrl && (
                    <input type="hidden" name="logo_url" value={logoUrl} />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="name">Business Name *</Label>
              <Input id="name" name="name" defaultValue={profile.name} required />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={profile.email} />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={profile.phone} />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={profile.address} />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" defaultValue={profile.website} />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input id="tax_id" name="tax_id" defaultValue={profile.tax_id} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
