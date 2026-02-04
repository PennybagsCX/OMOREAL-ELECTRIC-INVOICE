"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  required?: boolean
  id?: string
  name?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  required = false,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const dateString = value ? format(value, "yyyy-MM-dd") : ""

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            id={id}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
            {required && <span className="text-destructive ml-1">*</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          value={dateString}
          required={required}
        />
      )}
    </>
  )
}

