'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, ChevronDown, Edit3 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion } from 'framer-motion'
import type { WeddingPlan } from '@/lib/wedding-url'

export type UserWedding = {
  id: string
  wedding_name_id: string
  partner1_first_name: string
  partner2_first_name: string
  wedding_date: string | null
  has_website: boolean
  plan?: WeddingPlan
}

export function AuthButtons({ isMobile = false, userWeddings: externalWeddings, weddingsLoading: externalLoading }: { isMobile?: boolean, userWeddings?: UserWedding[], weddingsLoading?: boolean }) {
  const { user, loading, signOut } = useAuth()
  const { t } = useTranslation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [internalWeddings, setInternalWeddings] = useState<UserWedding[]>([])
  const [internalLoading, setInternalLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const userWeddings = externalWeddings ?? internalWeddings
  const weddingsLoading = externalLoading ?? internalLoading

  useEffect(() => {
    if (externalWeddings !== undefined) return
    if (user) {
      setInternalLoading(true)
      fetch('/api/weddings')
        .then(res => res.json())
        .then(data => setInternalWeddings(data.weddings || []))
        .finally(() => setInternalLoading(false))
    } else {
      setInternalWeddings([])
    }
  }, [user, externalWeddings])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="h-10 w-20 bg-[#420c14]/20 animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-[#420c14]/20 animate-pulse rounded-md" />
      </div>
    )
  }

  if (user) {
    const hasWedding = userWeddings.length > 0
    const firstWedding = userWeddings[0]

    if (isMobile) {
      return (
        <div className="flex flex-col gap-4 w-full">
          <div className="pb-4 border-b border-[#DDA46F]/20">
            <p className="text-xs text-[#f5f2eb]/50 mb-1">{t('landing.nav.signedInAs')}</p>
            <p className="text-sm font-medium text-[#f5f2eb]/90 truncate">{user.email}</p>
          </div>
          
          {userWeddings.length > 0 && (
            <div className="pb-4 border-b border-[#DDA46F]/20">
              <p className="text-xs text-[#f5f2eb]/50 font-semibold mb-2">{t('landing.nav.yourWeddings')} ({userWeddings.length})</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {userWeddings.map(wedding => (
                  <Link
                    key={wedding.id}
                    href={`/admin/${wedding.wedding_name_id}/dashboard`}
                    className="block px-3 py-2 text-sm text-[#f5f2eb]/80 hover:text-[#f5f2eb] bg-[#f5f2eb]/5 hover:bg-[#f5f2eb]/10 rounded-md transition-colors duration-150"
                  >
                    <div className="font-medium truncate">{wedding.partner1_first_name} & {wedding.partner2_first_name}</div>
                    {wedding.wedding_date && <div className="text-xs text-[#f5f2eb]/50 mt-0.5">{new Date(wedding.wedding_date).toLocaleDateString()}</div>}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            {weddingsLoading ? (
              <div className="h-12 w-full bg-[#420c14]/20 animate-pulse rounded-md" />
            ) : hasWedding ? (
              <Link href={userWeddings.length === 1 ? `/admin/${firstWedding.wedding_name_id}/dashboard` : '/admin'} className="w-full">
                <Button className="w-full bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t('landing.nav.dashboard')}
                </Button>
              </Link>
            ) : (
              <Link href="/create-wedding" className="w-full">
                <Button className="w-full bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
                  {t('landing.nav.createWedding')}
                </Button>
              </Link>
            )}
            
            <button
              onClick={() => signOut()}
              className="w-full text-left px-4 py-3 text-sm text-[#DDA46F] hover:bg-[#DDA46F]/10 rounded-md transition-colors duration-200"
            >
              {t('landing.nav.signOut')}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex gap-3 items-center">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[#f5f2eb]/90 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-colors duration-200"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium hidden xl:inline max-w-[150px] truncate">{user.email}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full right-0 mt-2 bg-[#420c14]/98 backdrop-blur-xl rounded-lg shadow-2xl border border-[#DDA46F]/20 py-2 z-50 min-w-[280px] max-h-[60vh] overflow-y-auto"
            >
              <div className="px-4 py-3 border-b border-[#DDA46F]/10">
                <p className="text-xs text-[#f5f2eb]/50 mb-1">{t('landing.nav.signedInAs')}</p>
                <p className="text-sm font-medium text-[#f5f2eb]/90 truncate" title={user.email}>{user.email}</p>
              </div>
              {userWeddings.length > 0 && (
                <div className="border-b border-[#DDA46F]/10 max-h-[280px] overflow-y-auto">
                  <p className="px-4 py-2 text-xs text-[#f5f2eb]/50 font-semibold sticky top-0 bg-[#420c14]/98">{t('landing.nav.yourWeddings')}</p>
                  {userWeddings.map(wedding => (
                    <Link
                      key={wedding.id}
                      href={`/admin/${wedding.wedding_name_id}/dashboard`}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm text-[#f5f2eb]/80 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-colors duration-150 border-l-2 border-transparent hover:border-[#DDA46F]"
                    >
                      <div className="font-medium">{wedding.partner1_first_name} & {wedding.partner2_first_name}</div>
                      {wedding.wedding_date && <div className="text-xs text-[#f5f2eb]/50 mt-0.5">{new Date(wedding.wedding_date).toLocaleDateString()}</div>}
                    </Link>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  signOut()
                }}
                className="w-full text-left px-4 py-3 text-sm text-[#DDA46F] hover:bg-[#DDA46F]/10 transition-colors duration-200 border-t border-[#DDA46F]/10"
              >
                {t('landing.nav.signOut')}
              </button>
            </motion.div>
          )}
        </div>
        {weddingsLoading ? (
          <div className="h-10 w-32 bg-[#420c14]/20 animate-pulse rounded-md" />
        ) : hasWedding ? (
          <Link href={userWeddings.length === 1 ? `/admin/${firstWedding.wedding_name_id}/dashboard` : '/admin'}>
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
              <Edit3 className="w-4 h-4 mr-2" />
              {t('landing.nav.dashboard')}
            </Button>
          </Link>
        ) : (
          <Link href="/create-wedding">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
              {t('landing.nav.createWedding')}
            </Button>
          </Link>
        )}
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Link href="/login" className="w-full">
          <Button variant="ghost" className="w-full text-[#f5f2eb]/80 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-all duration-200">
            {t('landing.nav.signIn')}
          </Button>
        </Link>
        <Link href="/create-wedding" className="w-full">
          <Button className="w-full bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
            {t('landing.nav.getStarted')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <Link href="/login">
        <Button variant="ghost" className="text-[#f5f2eb]/80 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-all duration-200">
          {t('landing.nav.signIn')}
        </Button>
      </Link>
      <Link href="/create-wedding">
        <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
          {t('landing.nav.getStarted')}
        </Button>
      </Link>
    </div>
  )
}
