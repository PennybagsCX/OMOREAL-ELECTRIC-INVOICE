'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, QrCode } from 'lucide-react'

interface CalendarSubscriptionButtonsProps {
  feedUrl: string // http://localhost:3000/api/calendar/feed?token=demo-token
  webcalUrl: string // webcal://localhost:3000/api/calendar/feed?token=demo-token
}

export function CalendarSubscriptionButtons({ feedUrl, webcalUrl }: CalendarSubscriptionButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Google Calendar URL (needs https:// not webcal://)
  const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`

  // For Apple/Outlook, use webcal://
  const appleUrl = webcalUrl
  const outlookUrl = webcalUrl

  return (
    <div className="space-y-4 max-w-full">
      {/* Quick Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          asChild
          variant="default"
          className="w-full"
        >
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            <span className="truncate">Google</span>
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <a href={appleUrl} target="_blank" rel="noopener noreferrer">
            <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V8h14v12z"/>
            </svg>
            <span className="truncate">Apple</span>
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <a href={outlookUrl} target="_blank" rel="noopener noreferrer">
            <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8l7 5 7-5v11zm-7-8L5 6h14l-7 5z"/>
            </svg>
            <span className="truncate">Outlook</span>
          </a>
        </Button>
      </div>

      {/* QR Code Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQR(!showQR)}
          className="text-muted-foreground text-xs"
        >
          <QrCode className="h-4 w-4 mr-2 shrink-0" />
          <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground text-xs"
        >
          {copied ? <Check className="h-4 w-4 mr-2 shrink-0" /> : <Copy className="h-4 w-4 mr-2 shrink-0" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </Button>
      </div>

      {/* QR Code for Mobile */}
      {showQR && (
        <div className="flex justify-center p-4 bg-white rounded-lg border overflow-x-auto">
          <QRCodeSVG
            value={feedUrl}
            size={180}
            level="M"
            includeMargin={true}
          />
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Tap a button to open in your calendar, or scan QR on mobile
      </p>
    </div>
  )
}
