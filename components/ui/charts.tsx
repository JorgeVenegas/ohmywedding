"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Label } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

// Chart color palette
export const CHART_COLORS = {
  emerald: "hsl(142 76% 36%)",
  blue: "hsl(221 83% 53%)",
  amber: "hsl(32 95% 44%)",
  red: "hsl(0 84% 60%)",
  purple: "hsl(258 90% 66%)",
  cyan: "hsl(189 94% 43%)",
  pink: "hsl(330 81% 60%)",
  indigo: "hsl(239 84% 67%)",
}

// Simple Card wrapper
interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="p-6 pb-4">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  )
}

// Stat Card component
interface StatCardProps {
  label: string
  value: number | string
  color: keyof typeof CHART_COLORS
  subtitle?: string
  className?: string
}

export function StatCard({ label, value, color, subtitle, className }: StatCardProps) {
  const colorValue = CHART_COLORS[color]

  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colorValue }} />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color: colorValue }}>
        {value}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

// Area Chart Component
interface AreaChartProps {
  data: Array<Record<string, string | number>>
  xAxisKey: string
  areas: Array<{
    dataKey: string
    name: string
    color: keyof typeof CHART_COLORS
  }>
  height?: number
  xAxisFormatter?: (value: string) => string
  labelFormatter?: (value: string) => string
  className?: string
}

export function InteractiveAreaChart({
  data,
  xAxisKey,
  areas,
  height = 350,
  xAxisFormatter,
  labelFormatter,
  className,
}: AreaChartProps) {
  const chartConfig: ChartConfig = areas.reduce((acc, area) => {
    acc[area.dataKey] = {
      label: area.name,
      color: CHART_COLORS[area.color],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={xAxisFormatter}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={labelFormatter} />} />
            <defs>
              {areas.map((area) => {
                const color = CHART_COLORS[area.color]
                return (
                  <linearGradient key={area.dataKey} id={`fill${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                )
              })}
            </defs>
            {areas.map((area) => {
              const color = CHART_COLORS[area.color]
              return (
                <Area
                  key={area.dataKey}
                  dataKey={area.dataKey}
                  type="natural"
                  fill={`url(#fill${area.dataKey})`}
                  fillOpacity={0.4}
                  stroke={color}
                  strokeWidth={1.5}
                  stackId="a"
                />
              )
            })}
          </AreaChart>
      </ChartContainer>
    </div>
  )
}

// Horizontal Bar Chart Component
interface StackedBarChartProps {
  data: Array<Record<string, string | number>>
  categoryKey: string
  bars: Array<{
    dataKey: string
    name: string
    color: keyof typeof CHART_COLORS
  }>
  height?: number
  className?: string
}

export function StackedBarChart({ data, categoryKey, bars, height = 300, className }: StackedBarChartProps) {
  // Calculate dynamic height
  const dynamicHeight = Math.max(height, data.length * 50 + 80)

  const chartConfig: ChartConfig = bars.reduce((acc, bar) => {
    acc[bar.dataKey] = {
      label: bar.name,
      color: CHART_COLORS[bar.color],
    }
    return acc
  }, {} as ChartConfig)

  // Create data with individual fill colors for each bar
  const transformedData = data.map((item, index) => {
    const result: Record<string, unknown> = { ...item }
    bars.forEach((bar) => {
      result[`${bar.dataKey}Fill`] = CHART_COLORS[bar.color]
    })
    return result
  })

  return (
    <div className={cn("w-full", className)} style={{ height: dynamicHeight }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart
            accessibilityLayer
            data={transformedData}
            layout="vertical"
            margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
          >
            <YAxis dataKey={categoryKey} type="category" tickLine={false} tickMargin={10} axisLine={false} width={100} />
            <XAxis type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            {bars.map((bar) => (
              <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={CHART_COLORS[bar.color]} radius={5} />
            ))}
          </BarChart>
      </ChartContainer>
    </div>
  )
}

// Donut Chart Component
interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  innerRadius?: number
  outerRadius?: number
  className?: string
}

const PIE_COLORS = ["hsl(221 83% 53%)", "hsl(142 76% 36%)", "hsl(32 95% 44%)", "hsl(0 84% 60%)", "hsl(258 90% 66%)", "hsl(189 94% 43%)", "hsl(330 81% 60%)", "hsl(239 84% 67%)"]

export function DonutChart({ data, height = 300, innerRadius = 60, className }: DonutChartProps) {
  const total = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    const key = item.name.toLowerCase().replace(/\s+/g, "-")
    acc[key] = {
      label: item.name,
      color: item.color || PIE_COLORS[index % PIE_COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: item.color || PIE_COLORS[index % PIE_COLORS.length],
  }))

  return (
    <div className={cn("w-full flex flex-col", className)} style={{ height }}>
      <ChartContainer config={chartConfig} className="w-full h-full">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={innerRadius} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
      </ChartContainer>
    </div>
  )
}
