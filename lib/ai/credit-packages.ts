export interface CreditPackage {
  id:           string
  amount_cents: number
  label:        string
  description:  string
}

export const AI_CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'ai_500',  amount_cents: 500,  label: '$5 USD',  description: '~10,000 messages' },
  { id: 'ai_1000', amount_cents: 1000, label: '$10 USD', description: '~20,000 messages' },
  { id: 'ai_2500', amount_cents: 2500, label: '$25 USD', description: '~55,000 messages' },
]
