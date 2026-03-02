export interface Supplier {
  id: string
  wedding_id: string
  name: string
  category: string
  contact_info: string | null
  contact_type: 'phone' | 'email' | 'website' | 'other'
  contract_url: string | null
  total_amount: number
  notes: string | null
  display_order: number
  created_at: string
  updated_at: string
  payments: SupplierPayment[]
  covered_amount: number
}

export interface SupplierPayment {
  id: string
  supplier_id: string
  wedding_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
}

export const SUPPLIER_CATEGORIES = [
  'catering',
  'photography',
  'videography',
  'music',
  'flowers',
  'venue',
  'transport',
  'decoration',
  'cake',
  'beauty',
  'officiant',
  'lighting',
  'other',
] as const

export type SupplierCategory = typeof SUPPLIER_CATEGORIES[number]

export const SUPPLIER_CATEGORIES_LIST: { value: string; labelKey: string }[] = [
  { value: 'catering', labelKey: 'admin.suppliers.categories.catering' },
  { value: 'photography', labelKey: 'admin.suppliers.categories.photography' },
  { value: 'videography', labelKey: 'admin.suppliers.categories.videography' },
  { value: 'music', labelKey: 'admin.suppliers.categories.music' },
  { value: 'flowers', labelKey: 'admin.suppliers.categories.flowers' },
  { value: 'venue', labelKey: 'admin.suppliers.categories.venue' },
  { value: 'transport', labelKey: 'admin.suppliers.categories.transport' },
  { value: 'decoration', labelKey: 'admin.suppliers.categories.decoration' },
  { value: 'cake', labelKey: 'admin.suppliers.categories.cake' },
  { value: 'beauty', labelKey: 'admin.suppliers.categories.beauty' },
  { value: 'officiant', labelKey: 'admin.suppliers.categories.officiant' },
  { value: 'lighting', labelKey: 'admin.suppliers.categories.lighting' },
  { value: 'other', labelKey: 'admin.suppliers.categories.other' },
]
