'use client'

import { Button } from '@/components/ui/button'
import { Link as LinkIcon, Check } from 'lucide-react'
import { useState } from 'react'

interface CopyFeedButtonProps {
  url: string
}

export function CopyFeedButton({ url }: CopyFeedButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button size="sm" variant="outline" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4 mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  )
}
