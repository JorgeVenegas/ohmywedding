"use client"

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/components/contexts/i18n-context'
import { Upload, ExternalLink, FileText, X, Loader2, Link } from 'lucide-react'
import type { Supplier, SupplierCategory } from '../types'
import { SUPPLIER_CATEGORIES_LIST } from '../types'

interface SupplierModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Supplier>) => Promise<void>
  supplier?: Supplier | null
  saving: boolean
}

export function SupplierModal({ open, onClose, onSave, supplier, saving }: SupplierModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingContract, setUploadingContract] = useState(false)
  const [contractMode, setContractMode] = useState<'url' | 'file'>('url')
  const [form, setForm] = useState({
    name: '',
    category: 'other' as SupplierCategory,
    contact_info: '',
    contact_type: 'email' as 'phone' | 'email' | 'website' | 'other',
    contract_url: '',
    contract_file_name: '',
    total_amount: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      if (supplier) {
        const isUploadedFile = supplier.contract_url?.includes('/contracts/')
        setContractMode(isUploadedFile ? 'file' : 'url')
        setForm({
          name: supplier.name,
          category: (supplier.category as SupplierCategory) || 'other',
          contact_info: supplier.contact_info || '',
          contact_type: supplier.contact_type || 'email',
          contract_url: supplier.contract_url || '',
          contract_file_name: isUploadedFile ? decodeURIComponent(supplier.contract_url?.split('/').pop() || '') : '',
          total_amount: String(supplier.total_amount || ''),
          notes: supplier.notes || '',
        })
      } else {
        setContractMode('url')
        setForm({ name: '', category: 'other', contact_info: '', contact_type: 'email', contract_url: '', contract_file_name: '', total_amount: '', notes: '' })
      }
    }
  }, [open, supplier])

  const handleContractFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingContract(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed')
      setForm(p => ({ ...p, contract_url: data.url, contract_file_name: data.fileName }))
    } catch (err) {
      console.error('Contract upload error:', err)
    } finally {
      setUploadingContract(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    await onSave({
      ...(supplier?.id ? { id: supplier.id } : {}),
      name: form.name.trim(),
      category: form.category,
      contact_info: form.contact_info.trim() || null,
      contact_type: form.contact_type,
      contract_url: form.contract_url.trim() || null,
      total_amount: parseFloat(form.total_amount) || 0,
      notes: form.notes.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle>
            {supplier ? t('admin.suppliers.editSupplier') : t('admin.suppliers.addSupplier')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.supplierName')} *</label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={t('admin.suppliers.namePlaceholder')}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.category')}</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as SupplierCategory }))}
              className="w-full h-11 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm px-4 text-sm shadow-sm transition-all duration-300 outline-none focus:ring-[3px] focus:ring-ring/50 focus:border-ring hover:border-primary/30"
            >
              {SUPPLIER_CATEGORIES_LIST.map(cat => (
                <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.contactType')}</label>
              <select
                value={form.contact_type}
                onChange={e => setForm(p => ({ ...p, contact_type: e.target.value as 'phone' | 'email' | 'website' | 'other' }))}
                className="w-full h-11 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm px-4 text-sm shadow-sm transition-all duration-300 outline-none focus:ring-[3px] focus:ring-ring/50 focus:border-ring hover:border-primary/30"
              >
                <option value="email">{t('admin.suppliers.contactTypes.email')}</option>
                <option value="phone">{t('admin.suppliers.contactTypes.phone')}</option>
                <option value="website">{t('admin.suppliers.contactTypes.website')}</option>
                <option value="other">{t('admin.suppliers.contactTypes.other')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.contactInfo')}</label>
              <Input
                value={form.contact_info}
                onChange={e => setForm(p => ({ ...p, contact_info: e.target.value }))}
                placeholder={
                  form.contact_type === 'email' ? 'contact@example.com'
                    : form.contact_type === 'phone' ? '+1 555 000 0000'
                    : form.contact_type === 'website' ? 'https://...'
                    : t('admin.suppliers.contactInfoPlaceholder')
                }
              />
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.totalAmount')}</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.total_amount}
              onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          {/* Contract */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {t('admin.suppliers.contract')}
              </label>
              <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => { setContractMode('url'); setForm(p => ({ ...p, contract_url: '', contract_file_name: '' })) }}
                  className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${contractMode === 'url' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  <Link className="w-3 h-3" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => { setContractMode('file'); setForm(p => ({ ...p, contract_url: '', contract_file_name: '' })) }}
                  className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${contractMode === 'file' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  <Upload className="w-3 h-3" />
                  {t('admin.suppliers.uploadFile')}
                </button>
              </div>
            </div>

            {contractMode === 'url' ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={form.contract_url}
                    onChange={e => setForm(p => ({ ...p, contract_url: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="flex-1"
                  />
                  {form.contract_url && (
                    <a href={form.contract_url} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="outline" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('admin.suppliers.contractUrlHint')}</p>
              </>
            ) : (
              <div>
                {form.contract_url && form.contract_file_name ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a
                      href={form.contract_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-primary hover:underline"
                    >
                      {form.contract_file_name}
                    </a>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, contract_url: '', contract_file_name: '' }))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingContract}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 bg-background/30 hover:bg-muted/40 hover:border-primary/40 transition-colors py-6 text-sm text-muted-foreground disabled:opacity-50"
                  >
                    {uploadingContract ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />{t('admin.suppliers.uploading')}</>
                    ) : (
                      <><Upload className="w-5 h-5" />{t('admin.suppliers.uploadFileHint')}</>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  className="hidden"
                  onChange={handleContractFileChange}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.suppliers.notes')}</label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder={t('admin.suppliers.notesPlaceholder')}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || saving}>
              {saving ? t('admin.settings.saving') : supplier ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
