'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'

interface ShareButtonProps {
  estimateId: string
  publicToken: string | null
  onGenerate: (formData: FormData) => Promise<void>
}

export function ShareButton({ estimateId, publicToken, onGenerate }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (publicToken) {
      setShareUrl(`${window.location.origin}/estimates/public/${publicToken}`)
    }
  }, [publicToken])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerate = async () => {
    const formData = new FormData()
    formData.append('id', estimateId)
    await onGenerate(formData)
    router.refresh()
  }

  if (!publicToken) {
    return (
      <Button
        onClick={handleGenerate}
        variant="outline"
        className="w-full"
      >
        Generate Share Link
      </Button>
    )
  }

  return (
    <div className="rounded-md bg-muted p-3 space-y-2">
      <p className="text-sm font-medium">Share Link</p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={shareUrl}
          className="text-xs"
        />
        <Button
          size="sm"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
