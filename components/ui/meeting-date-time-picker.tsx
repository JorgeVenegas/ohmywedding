"use client"

import { WeddingDatePicker } from "@/components/ui/wedding-date-picker"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface MeetingDateTimePickerProps {
  value: string       // "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MeetingDateTimePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: MeetingDateTimePickerProps) {
  const [datePart, timePart] = value ? value.split("T") : ["", ""]

  const handleDateChange = (newDate: string) => {
    onChange(newDate ? `${newDate}T${timePart || "10:00"}` : "")
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!datePart) return
    onChange(`${datePart}T${e.target.value}`)
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <WeddingDatePicker
        value={datePart}
        onChange={handleDateChange}
        placeholder={placeholder ?? "Select date"}
        locale="en"
        disabled={disabled}
        className="flex-1 min-w-0"
      />

      <div className="relative shrink-0">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#DDA46F] pointer-events-none" />
        <input
          type="time"
          value={timePart || ""}
          onChange={handleTimeChange}
          disabled={disabled || !datePart}
          className={cn(
            "h-9 pl-8 pr-3 w-[118px] rounded-md border text-sm transition-all bg-background",
            "text-[#420c14] placeholder:text-muted-foreground",
            "hover:border-[#DDA46F]/50",
            "focus:outline-none focus:border-[#DDA46F] focus:ring-2 focus:ring-[#DDA46F]/20",
            (!datePart || disabled) && "opacity-40 cursor-not-allowed pointer-events-none",
            timePart ? "border-input" : "border-input"
          )}
        />
      </div>
    </div>
  )
}
