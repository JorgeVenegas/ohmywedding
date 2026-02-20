"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import { ArrowLeft, Printer } from "lucide-react"
import type { TableWithAssignments, VenueElement } from "../types"

interface PrintViewProps {
  tables: TableWithAssignments[]
  venueElements: VenueElement[]
  onClose: () => void
}

export function PrintView({ tables, venueElements, onClose }: PrintViewProps) {
  const { t } = useTranslation()

  const sortedTables = [...tables].sort((a, b) => a.display_order - b.display_order)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Non-printable toolbar */}
      <div className="print:hidden flex items-center gap-2 px-6 py-3 bg-gray-50 border-b sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" />
          {t('admin.seating.toolbar.printExport')}
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          {t('admin.seating.print.title')}
        </h1>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
          {sortedTables.map((table) => (
            <div
              key={table.id}
              className="border rounded-lg p-4 break-inside-avoid"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{table.name}</h3>
                <span className={`text-sm ${table.isOverfilled ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                  {table.occupancy}/{table.capacity}
                </span>
              </div>

              {table.assignedGuests.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {t('admin.seating.table.noGuests')}
                </p>
              ) : (
                <ol className="space-y-1">
                  {table.assignedGuests.map((a, i) => (
                    <li key={a.id} className="text-sm flex items-center gap-2">
                      <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                      <span>{a.guests?.name || 'Unknown'}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>

        {/* Full Guest List */}
        <div className="mt-12 break-before-page">
          <h2 className="text-2xl font-bold mb-4">{t('admin.seating.print.guestList')}</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-2 pr-4">#</th>
                <th className="text-left py-2 pr-4">Guest</th>
                <th className="text-left py-2">Table</th>
              </tr>
            </thead>
            <tbody>
              {sortedTables.flatMap((table) =>
                table.assignedGuests.map((a, i) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-1.5 pr-4 text-muted-foreground">
                      {sortedTables
                        .slice(0, sortedTables.indexOf(table))
                        .reduce((sum, t) => sum + t.assignedGuests.length, 0) +
                        i +
                        1}
                    </td>
                    <td className="py-1.5 pr-4">{a.guests?.name || 'Unknown'}</td>
                    <td className="py-1.5">{table.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
