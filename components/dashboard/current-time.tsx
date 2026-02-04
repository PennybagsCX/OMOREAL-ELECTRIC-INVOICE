'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'

export function CurrentTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    // Update time immediately and then every second
    const updateTime = () => {
      // Toronto time is Eastern Time (EST/EDT)
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Toronto',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }
      setTime(new Intl.DateTimeFormat('en-US', options).format(now))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="h-4 w-4" />
      <span>{time}</span>
      <span className="text-xs ml-1">(EST)</span>
    </div>
  )
}
