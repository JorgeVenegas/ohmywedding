"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Plus, Heart, Calendar, ArrowRight, LogOut, Crown, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/components/contexts/i18n-context"
import { motion, AnimatePresence } from "framer-motion"

type Wedding = {
  id: string
  wedding_name_id: string
  partner1_first_name: string
  partner2_first_name: string
  wedding_date: string | null
  has_website: boolean
  plan: string
}

const planBadge: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  premium: { label: 'Premium', color: 'bg-[#DDA46F]/20 text-[#DDA46F] border-[#DDA46F]/30', icon: Sparkles },
  deluxe: { label: 'Deluxe', color: 'bg-[#732c2c]/20 text-[#e8a0a0] border-[#732c2c]/30', icon: Crown },
}

export default function WeddingSelectorPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { t } = useTranslation()
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    fetch('/api/weddings')
      .then(res => res.json())
      .then(data => {
        const list = data.weddings || []
        // Auto-redirect if only one wedding
        if (list.length === 1) {
          router.replace(`/admin/${list[0].id}/dashboard`)
          return
        }
        setWeddings(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="page-container flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading your weddings...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('admin.dashboard.signOut')}
          </Button>
        }
      />

      <div className="page-container">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('admin.selector.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.selector.description')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {weddings.map((wedding, i) => {
              const badge = planBadge[wedding.plan]
              const BadgeIcon = badge?.icon
              return (
                <motion.div
                  key={wedding.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={`/admin/${wedding.wedding_name_id}/dashboard`}>
                    <Card className="p-6 border transition-all duration-300 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:bg-primary/5 group h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {wedding.partner1_first_name} & {wedding.partner2_first_name}
                      </h3>

                      {wedding.wedding_date && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(wedding.wedding_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-auto">
                        {badge && BadgeIcon && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        )}
                        {wedding.has_website && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                            Website
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}

            {/* Create new wedding card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weddings.length * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href="/create-wedding">
                <Card className="p-6 border border-dashed transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-primary/5 group h-full flex flex-col items-center justify-center min-h-[180px]">
                  <div className="p-3 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {t('admin.selector.createNew')}
                  </p>
                </Card>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
