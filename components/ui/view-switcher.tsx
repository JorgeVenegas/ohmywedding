"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface ViewSwitcherOption {
  value: string
  label: string
  icon: LucideIcon
}

interface ViewSwitcherProps {
  options: ViewSwitcherOption[]
  value: string
  onChange: (value: string) => void
  size?: "sm" | "default" | "lg"
}

export function ViewSwitcher({ options, value, onChange, size = "sm" }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      {options.map((option) => {
        const Icon = option.icon
        return (
          <Button
            key={option.value}
            size={size}
            variant={value === option.value ? "default" : "outline"}
            onClick={() => onChange(option.value)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
