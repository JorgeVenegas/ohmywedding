"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { DayPicker } from "react-day-picker"
import { format, parse, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeddingDatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
  locale?: "es" | "en"
  minDate?: Date
  maxDate?: Date
}

function parseYMD(str: string): Date | undefined {
  if (!str) return undefined
  const d = parse(str, "yyyy-MM-dd", new Date())
  return isValid(d) ? d : undefined
}

export function WeddingDatePicker({
  value,
  onChange,
  placeholder,
  label,
  className,
  disabled,
  locale = "es",
  minDate,
  maxDate,
}: WeddingDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() => parseYMD(value) ?? new Date())
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const selected = parseYMD(value)

  const updatePosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const popoverHeight = 320
    const top = spaceBelow >= popoverHeight
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - popoverHeight - 6
    setPopoverStyle({
      position: "absolute",
      top,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 280),
      zIndex: 9999,
    })
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener("scroll", updatePosition, { capture: true, passive: true })
    window.addEventListener("resize", updatePosition, { passive: true })
    return () => {
      window.removeEventListener("scroll", updatePosition, { capture: true })
      window.removeEventListener("resize", updatePosition)
    }
  }, [open])

  useEffect(() => {
    if (selected) setMonth(selected)
  }, [value])

  const displayLabel = selected
    ? locale === "es"
      ? format(selected, "d 'de' MMMM 'de' yyyy", { locale: es })
      : format(selected, "MMMM d, yyyy")
    : null

  const handleSelect = (day: Date | undefined) => {
    if (!day) return
    onChange(format(day, "yyyy-MM-dd"))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 h-9 rounded-md border text-sm transition-all",
          "bg-background text-left",
          open
            ? "border-[#DDA46F] ring-2 ring-[#DDA46F]/20 shadow-sm"
            : "border-input hover:border-[#DDA46F]/50",
          disabled && "opacity-50 cursor-not-allowed",
          !displayLabel && "text-muted-foreground"
        )}
      >
        <CalendarDays className="w-4 h-4 shrink-0 text-[#DDA46F]" />
        <span className="flex-1 truncate">
          {displayLabel ?? (placeholder ?? (locale === "es" ? "Seleccionar fecha" : "Select a date"))}
        </span>
        {displayLabel && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === "Enter" && handleClear(e as any)}
            className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Calendar popover — rendered in a portal to escape dialog overflow:hidden */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className={cn(
            "rounded-xl border border-[#420c14]/10 bg-white shadow-xl shadow-[#420c14]/10",
            "animate-in fade-in-0 zoom-in-95 duration-150 origin-top"
          )}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            locale={locale === "es" ? es : undefined}
            classNames={{
              root: "p-3 select-none",
              months: "flex flex-col",
              month: "space-y-3",
              month_caption: "flex items-center justify-between px-1",
              caption_label: "text-sm font-semibold text-[#420c14] capitalize",
              nav: "flex items-center gap-1",
              button_previous: cn(
                "h-7 w-7 rounded-md flex items-center justify-center text-[#420c14]/50",
                "hover:bg-[#420c14]/5 hover:text-[#420c14] transition-colors"
              ),
              button_next: cn(
                "h-7 w-7 rounded-md flex items-center justify-center text-[#420c14]/50",
                "hover:bg-[#420c14]/5 hover:text-[#420c14] transition-colors"
              ),
              month_grid: "w-full border-collapse",
              weekdays: "flex mb-1",
              weekday: "w-9 text-center text-[10px] font-medium text-[#420c14]/30 uppercase tracking-wider pb-1",
              weeks: "space-y-0.5",
              week: "flex",
              day: "relative p-0 text-center",
              day_button: cn(
                "h-9 w-9 rounded-lg text-sm font-medium transition-all",
                "text-[#420c14]/70 hover:bg-[#DDA46F]/15 hover:text-[#420c14]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA46F]"
              ),
              selected: "!bg-[#420c14] !text-[#f5f2eb] !rounded-lg shadow-sm shadow-[#420c14]/30 hover:!bg-[#5a1a22]",
              today: "font-bold text-[#DDA46F]",
              outside: "opacity-30",
              disabled: "opacity-20 pointer-events-none",
              range_start: "rounded-l-lg",
              range_end: "rounded-r-lg",
              range_middle: "rounded-none",
              hidden: "invisible",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left"
                  ? <ChevronLeft className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />,
            }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
