import { redirect, notFound } from 'next/navigation'

// Map template IDs to their demo wedding_name_id
const DEMO_WEDDING_IDS: Record<string, string> = {
  'classic-elegance': 'demo-classic-elegance',
  'modern-minimal': 'demo-modern-minimal',
  'romantic-garden': 'demo-romantic-garden',
  'rustic-charm': 'demo-rustic-charm',
  'luxury-noir': 'demo-luxury-noir',
  'simple-love': 'demo-simple-love'
}

interface PageProps {
  params: Promise<{ templateId: string }>
}

export default async function DemoTemplateRedirect({ params }: PageProps) {
  const { templateId } = await params
  const demoWeddingId = DEMO_WEDDING_IDS[templateId]
  
  if (!demoWeddingId) {
    notFound()
  }
  
  // Redirect to the database-stored demo wedding
  redirect(`/${demoWeddingId}`)
}
