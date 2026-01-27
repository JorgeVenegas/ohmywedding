"use client"

import { X, FileSpreadsheet, UserPlus, Users, AlertCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface DBField {
  key: string
  label: string
  required?: boolean
}

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  csvData: string[][]
  csvHeaders: string[]
  csvImportMode: 'guests' | 'groups'
  setCsvImportMode: (mode: 'guests' | 'groups') => void
  columnMapping: Record<string, string>
  setColumnMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>
  csvImportError: string | null
  csvImporting: boolean
  dbFields: DBField[]
  onImport: () => void
}

export function CsvImportModal({
  isOpen,
  onClose,
  csvData,
  csvHeaders,
  csvImportMode,
  setCsvImportMode,
  columnMapping,
  setColumnMapping,
  csvImportError,
  csvImporting,
  dbFields,
  onImport,
}: CsvImportModalProps) {
  if (!isOpen) return null

  const updateColumnMapping = (csvIndex: string, dbField: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev }
      if (dbField === '') {
        delete newMapping[csvIndex]
      } else {
        newMapping[csvIndex] = dbField
      }
      return newMapping
    })
  }

  const handleModeChange = (mode: 'guests' | 'groups') => {
    setCsvImportMode(mode)
    setColumnMapping({})
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Import from CSV</h2>
                <p className="text-sm text-muted-foreground">
                  {csvData.length} rows found. Map columns and import.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Import Mode Selector */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Import Mode</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('guests')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${csvImportMode === 'guests'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">Import Guests</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Import individual guests with names. Groups will be auto-created.
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('groups')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${csvImportMode === 'groups'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Import Groups</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Import groups with guest count. Guests named &quot;Guest 1&quot;, &quot;Guest 2&quot;, etc.
                </p>
              </button>
            </div>
          </div>

          {/* Error message */}
          {csvImportError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{csvImportError}</span>
            </div>
          )}

          {/* Column Mapping */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Column Mapping</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {csvImportMode === 'groups'
                ? 'Map columns. Group Name and Number of Guests are required.'
                : 'Map columns. Guest Name and Group Name are required.'
              }
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-1/2">CSV Column</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-1/2">Map to Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvHeaders.map((header, index) => (
                    <tr key={index} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{header || `Column ${index + 1}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={columnMapping[index.toString()] || ''}
                          onChange={(e) => updateColumnMapping(index.toString(), e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${columnMapping[index.toString()] === 'name' || columnMapping[index.toString()] === 'groupName' || columnMapping[index.toString()] === 'guestCount'
                              ? 'border-green-300 bg-green-50/50'
                              : columnMapping[index.toString()]
                                ? 'border-primary/30 bg-primary/5'
                                : ''
                            }`}
                        >
                          <option value="">-- Don&apos;t import --</option>
                          {dbFields.map(field => {
                            const isMapped = Object.entries(columnMapping).some(
                              ([key, val]) => val === field.key && key !== index.toString()
                            )
                            return (
                              <option
                                key={field.key}
                                value={field.key}
                                disabled={isMapped}
                              >
                                {field.label}{field.required ? ' *' : ''}
                              </option>
                            )
                          })}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Required field indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="text-red-500">*</span>
              <span>Required field</span>
              {csvImportMode === 'groups' ? (
                <>
                  {!Object.values(columnMapping).includes('groupName') && (
                    <span className="ml-4 text-amber-600 font-medium">
                      ⚠️ Group Name must be mapped
                    </span>
                  )}
                  {!Object.values(columnMapping).includes('guestCount') && (
                    <span className="ml-4 text-amber-600 font-medium">
                      ⚠️ Number of Guests must be mapped
                    </span>
                  )}
                </>
              ) : (
                <>
                  {!Object.values(columnMapping).includes('name') && (
                    <span className="ml-4 text-amber-600 font-medium">
                      ⚠️ Guest Name must be mapped
                    </span>
                  )}
                  {!Object.values(columnMapping).includes('groupName') && (
                    <span className="ml-4 text-amber-600 font-medium">
                      ⚠️ Group Name must be mapped
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Preview (first 5 rows)
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                    {dbFields.filter(f => Object.values(columnMapping).includes(f.key)).map(field => (
                      <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-muted/20">
                      <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                      {dbFields.filter(f => Object.values(columnMapping).includes(f.key)).map(field => {
                        const csvIndex = Object.entries(columnMapping).find(([, val]) => val === field.key)?.[0]
                        const value = csvIndex !== undefined ? row[parseInt(csvIndex)] || '' : ''
                        return (
                          <td key={field.key} className="px-3 py-2">
                            {value || <span className="text-muted-foreground italic">empty</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.length > 5 && (
              <p className="mt-2 text-xs text-muted-foreground">
                ... and {csvData.length - 5} more rows
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {csvImportMode === 'groups'
                ? `${csvData.length} groups will be created with auto-generated guests`
                : `${csvData.length} guests will be imported into groups`
              }
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onImport}
                disabled={csvImporting || (csvImportMode === 'groups'
                  ? !Object.values(columnMapping).includes('groupName') || !Object.values(columnMapping).includes('guestCount')
                  : !Object.values(columnMapping).includes('name') || !Object.values(columnMapping).includes('groupName')
                )}
              >
                {csvImporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {csvImportMode === 'groups'
                      ? `Import ${csvData.length} Groups`
                      : `Import ${csvData.length} Guests`
                    }
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
