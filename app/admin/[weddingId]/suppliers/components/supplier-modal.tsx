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

  const fieldClass = "w-full h-10 rounded-xl border border-[#420c14]/15 bg-[#fefdfb] px-3 text-sm text-[#420c14] placeholder:text-[#420c14]/30 outline-none focus:ring-2 focus:ring-[#420c14]/15 focus:border-[#420c14]/40 transition-all"
  const labelClass = "text-xs font-medium text-[#420c14]/60 uppercase tracking-wide mb-1.5 block"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-[#420c14]/15 bg-[#fefdfb] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#420c14] text-lg">
            {supplier ? t('admin.suppliers.editSupplier') : t('admin.suppliers.addSupplier')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div>
            <label className={labelClass}>{t('admin.suppliers.supplierName')} *</label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={t('admin.suppliers.namePlaceholder')}
              autoFocus
              className={fieldClass}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>{t('admin.suppliers.category')}</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as SupplierCategory }))}
              className={fieldClass}
            >
              {SUPPLIER_CATEGORIES_LIST.map(cat => (
                <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('admin.suppliers.contactType')}</label>
              <select
                value={form.contact_type}
                onChange={e => setForm(p => ({ ...p, contact_type: e.target.value as 'phone' | 'email' | 'website' | 'other' }))}
                className={fieldClass}
              >
                <option value="email">{t('admin.suppliers.contactTypes.email')}</option>
                <option value="phone">{t('admin.suppliers.contactTypes.phone')}</option>
                <option value="website">{t('admin.suppliers.contactTypes.website')}</option>
                <option value="other">{t('admin.suppliers.contactTypes.other')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('admin.suppliers.contactInfo')}</label>
              <Input
                value={form.contact_info}
                onChange={e => setForm(p => ({ ...p, contact_info: e.target.value }))}
                placeholder={
                  form.contact_type === 'email' ? 'contact@vendor.com'
                    : form.contact_type === 'phone' ? '+1 555 000 0000'
                    : form.contact_type === 'website' ? 'https://...'
                    : t('admin.suppliers.contactInfoPlaceholder')
                }
                className={fieldClass}
              />
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label className={labelClass}>{t('admin.suppliers.totalAmount')}</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.total_amount}
              onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>

          {/* Contract */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelClass} mb-0 flex items-center gap-1.5`}>
                <FileText className="w-3 h-3" />
                {t('admin.suppliers.contract')}
              </label>
              <div className="flex rounded-lg border border-[#420c14]/15 overflow-hidden text-[11px]">
                <button
                  type="button"
                  onClick={() => { setContractMode('url'); setForm(p => ({ ...p, contract_url: '', contract_file_name: '' })) }}
                  className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${contractMode === 'url' ? 'bg-[#420c14] text-[#f5f2eb]' : 'text-[#420c14]/50 hover:bg-[#420c14]/5'}`}
                >
                  <Link className="w-3 h-3" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => { setContractMode('file'); setForm(p => ({ ...p, contract_url: '', contract_file_name: '' })) }}
                  className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${contractMode === 'file' ? 'bg-[#420c14] text-[#f5f2eb]' : 'text-[#420c14]/50 hover:bg-[#420c14]/5'}`}
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
                    className={`${fieldClass} flex-1`}
                  />
                  {form.contract_url && (
                    <a href={form.contract_url} target="_blank" rel="noopener noreferrer">
                      <button type="button" className="h-10 w-10 rounded-xl border border-[#420c14]/15 flex items-center justify-center text-[#420c14]/40 hover:text-[#420c14] hover:bg-[#420c14]/5 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-[#420c14]/35 mt-1">{t('admin.suppliers.contractUrlHint')}</p>
              </>
            ) : (
              <div>
                {form.contract_url && form.contract_file_name ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[#420c14]/15 bg-[#f5f2eb] px-3 py-2.5 text-sm">
                    <FileText className="w-4 h-4 text-[#420c14]/30 shrink-0" />
                    <a href={form.contract_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-[#DDA46F] hover:underline text-xs">
                      {form.contract_file_name}
                    </a>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, contract_url: '', contract_file_name: '' }))}
                      className="text-[#420c14]/30 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingContract}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#420c14]/15 bg-[#f5f2eb]/50 hover:bg-[#f5f2eb] hover:border-[#DDA46F]/40 transition-colors py-6 text-sm text-[#420c14]/40 disabled:opacity-50"
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
            <label className={labelClass}>{t('admin.suppliers.notes')}</label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder={t('admin.suppliers.notesPlaceholder')}
              rows={3}
              className="w-full rounded-xl border border-[#420c14]/15 bg-[#fefdfb] px-3 py-2.5 text-sm text-[#420c14] placeholder:text-[#420c14]/30 outline-none focus:ring-2 focus:ring-[#420c14]/15 focus:border-[#420c14]/40 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-[#420c14]/8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-[#420c14]/15 text-sm text-[#420c14]/60 hover:bg-[#420c14]/5 hover:text-[#420c14] transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.name.trim() || saving}
              className="px-5 py-2 rounded-xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? t('admin.settings.saving') : supplier ? t('common.save') : t('common.add')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
