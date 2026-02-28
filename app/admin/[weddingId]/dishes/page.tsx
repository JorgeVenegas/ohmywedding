"use client"

import { use, useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, UtensilsCrossed, ImageIcon, Search, Users, Check } from "lucide-react"
import { AddEditMenuModal } from "./components/add-edit-menu-modal"
import type { MenuSavePayload } from "./components/add-edit-menu-modal"
import type { Menu, MenuAssignment } from "./types"
import Image from "next/image"

// Luxury color palette — deep rich tones, no gradients
const MENU_COLORS = [
  { stripe: 'bg-rose-800',    badge: 'bg-rose-50 text-rose-800',     pill: 'bg-rose-800 text-white border-rose-800',       ghost: 'border-rose-300 text-rose-700 hover:bg-rose-50 bg-background' },
  { stripe: 'bg-slate-700',   badge: 'bg-slate-100 text-slate-700',  pill: 'bg-slate-700 text-white border-slate-700',     ghost: 'border-slate-300 text-slate-600 hover:bg-slate-100 bg-background' },
  { stripe: 'bg-emerald-800', badge: 'bg-emerald-50 text-emerald-800', pill: 'bg-emerald-800 text-white border-emerald-800', ghost: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-background' },
  { stripe: 'bg-amber-700',   badge: 'bg-amber-50 text-amber-700',   pill: 'bg-amber-700 text-white border-amber-700',     ghost: 'border-amber-300 text-amber-700 hover:bg-amber-50 bg-background' },
  { stripe: 'bg-purple-800',  badge: 'bg-purple-50 text-purple-800', pill: 'bg-purple-800 text-white border-purple-800',   ghost: 'border-purple-300 text-purple-700 hover:bg-purple-50 bg-background' },
]
const MENU_LETTERS = ['A', 'B', 'C', 'D', 'E']

interface GuestInfo {
  id: string
  name: string
  guest_group_id: string | null
  confirmation_status: string
  groupName?: string
}

interface GroupInfo {
  id: string
  name: string
}

interface TableInfo {
  id: string
  name: string
  capacity: number
}

interface DishesPageProps {
  params: Promise<{ weddingId: string }>
}

export default function DishesPage({ params }: DishesPageProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()

  const [menus, setMenus] = useState<Menu[]>([])
  const [assignments, setAssignments] = useState<MenuAssignment[]>([])
  const [guests, setGuests] = useState<GuestInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [tables, setTables] = useState<TableInfo[]>([])
  const [seatAssignments, setSeatAssignments] = useState<{ table_id: string; guest_id: string }[]>([])
  const [activeTab, setActiveTab] = useState<'guests' | 'group' | 'table'>('guests')

  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [showAllGuests, setShowAllGuests] = useState(false)

  const assignmentMap = useMemo(
    () => assignments.reduce((acc, a) => { acc[a.guest_id] = a.menu_id; return acc }, {} as Record<string, string>),
    [assignments]
  )

  const fetchData = useCallback(async () => {
    try {
      const [menusRes, assignmentsRes, guestsRes, groupsRes, seatingRes] = await Promise.all([
        fetch(`/api/menus?weddingId=${encodeURIComponent(decodedWeddingId)}`),
        fetch(`/api/menus/assignments?weddingId=${encodeURIComponent(decodedWeddingId)}`),
        fetch(`/api/guests?weddingId=${encodeURIComponent(decodedWeddingId)}`),
        fetch(`/api/guest-groups?weddingId=${encodeURIComponent(decodedWeddingId)}`),
        fetch(`/api/seating?weddingId=${encodeURIComponent(decodedWeddingId)}`),
      ])
      const [menusData, assignmentsData, guestsData, groupsData, seatingData] = await Promise.all([
        menusRes.json(), assignmentsRes.json(), guestsRes.json(), groupsRes.json(), seatingRes.json(),
      ])
      setMenus(menusData.menus || [])
      setAssignments(assignmentsData.assignments || [])
      const allGroups: GroupInfo[] = groupsData.groups || groupsData.data || []
      setGroups(allGroups)
      setTables(seatingData.tables || [])
      setSeatAssignments(
        (seatingData.assignments || []).map((a: { table_id: string; guest_id: string }) => ({
          table_id: a.table_id,
          guest_id: a.guest_id,
        }))
      )
      setGuests(
        (guestsData.guests || guestsData.data || []).map((g: GuestInfo) => ({
          ...g,
          groupName: allGroups.find((grp) => grp.id === g.guest_group_id)?.name,
        }))
      )
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setLoading(false)
    }
  }, [decodedWeddingId, t])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Menu CRUD ───────────────────────────────────────────────────────────────

  const handleSaveMenu = async (menuData: MenuSavePayload) => {
    setSaving(true)
    try {
      const isEdit = !!menuData.id
      const url = isEdit
        ? `/api/menus?weddingId=${encodeURIComponent(decodedWeddingId)}&menuId=${menuData.id}`
        : `/api/menus?weddingId=${encodeURIComponent(decodedWeddingId)}`
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(menuData) })
      if (!res.ok) throw new Error()
      toast.success(isEdit ? t('admin.dishes.notifications.menuUpdated') : t('admin.dishes.notifications.menuCreated'))
      setShowMenuModal(false)
      setEditingMenu(null)
      fetchData()
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMenu = async () => {
    if (!deletingMenuId) return
    setSaving(true)
    try {
      await fetch(`/api/menus?weddingId=${encodeURIComponent(decodedWeddingId)}&menuId=${deletingMenuId}`, { method: 'DELETE' })
      toast.success(t('admin.dishes.notifications.menuDeleted'))
      setDeletingMenuId(null)
      fetchData()
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Bulk assignment (by group or table) ────────────────────────────────────

  const handleBulkAssign = async (menuId: string, opts: { groupId?: string; tableId?: string }) => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { menu_id: menuId }
      if (opts.groupId) body.group_id = opts.groupId
      if (opts.tableId) body.table_id = opts.tableId
      const res = await fetch(`/api/menus/assignments?weddingId=${encodeURIComponent(decodedWeddingId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(t('admin.dishes.notifications.menuAssigned').replace('{{count}}', String(data.count || 0)))
      fetchData()
    } catch {
      toast.error(t('admin.seating.notifications.error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Inline assignment toggle ────────────────────────────────────────────────

  const handleToggleAssignment = async (guestId: string, menuId: string) => {
    const isUnassign = assignmentMap[guestId] === menuId
    // Optimistic update
    setAssignments(prev => {
      const filtered = prev.filter(a => a.guest_id !== guestId)
      if (isUnassign) return filtered
      return [...filtered, { id: 'temp-' + guestId, wedding_id: '', guest_id: guestId, menu_id: menuId, created_at: '' }]
    })
    try {
      if (isUnassign) {
        await fetch(`/api/menus/assignments?weddingId=${encodeURIComponent(decodedWeddingId)}&guestId=${guestId}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/menus/assignments?weddingId=${encodeURIComponent(decodedWeddingId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menu_id: menuId, guest_ids: [guestId] }),
        })
      }
    } catch {
      toast.error(t('admin.seating.notifications.error'))
      fetchData() // revert on failure
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const confirmedGuests = useMemo(() => guests.filter(g => g.confirmation_status === 'confirmed'), [guests])
  const displayGuests = useMemo(() => {
    const base = showAllGuests ? guests : confirmedGuests
    const q = searchQuery.toLowerCase()
    return q ? base.filter(g => g.name.toLowerCase().includes(q) || g.groupName?.toLowerCase().includes(q)) : base
  }, [guests, confirmedGuests, showAllGuests, searchQuery])

  const menuAssignedCount = useMemo(() => {
    return menus.reduce((acc, m) => {
      acc[m.id] = assignments.filter(a => a.menu_id === m.id).length
      return acc
    }, {} as Record<string, number>)
  }, [menus, assignments])

  const totalAssigned = useMemo(() => confirmedGuests.filter(g => assignmentMap[g.id]).length, [confirmedGuests, assignmentMap])

  const tableGuestMap = useMemo(
    () => seatAssignments.reduce((acc, a) => {
      if (!acc[a.table_id]) acc[a.table_id] = []
      acc[a.table_id].push(a.guest_id)
      return acc
    }, {} as Record<string, string[]>),
    [seatAssignments]
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header showBackButton backHref={getCleanAdminUrl(weddingId, 'dashboard')} title={t('admin.dishes.title')} />
        <div className="page-container flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title={t('admin.dishes.title')}
        rightContent={
          <Button size="sm" onClick={() => { setEditingMenu(null); setShowMenuModal(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('admin.dishes.addMenu')}</span>
            <span className="sm:hidden">{t('admin.dishes.addMenu')}</span>
          </Button>
        }
      />

      <div className="page-container space-y-8">

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4">
          <Card className="p-4 flex-1 min-w-[120px]">
            <div className="text-2xl font-bold">{menus.length}</div>
            <div className="text-sm text-muted-foreground">{t('admin.dishes.stats.totalMenus')}</div>
          </Card>
          <Card className="p-4 flex-1 min-w-[120px]">
            <div className="text-2xl font-bold text-emerald-600">{totalAssigned}</div>
            <div className="text-sm text-muted-foreground">{t('admin.dishes.stats.assigned')}</div>
          </Card>
          <Card className="p-4 flex-1 min-w-[120px]">
            <div className={`text-2xl font-bold ${confirmedGuests.length - totalAssigned > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {Math.max(0, confirmedGuests.length - totalAssigned)}
            </div>
            <div className="text-sm text-muted-foreground">{t('admin.dishes.stats.unassigned')}</div>
          </Card>
        </div>

        {/* ── Menus grid ─────────────────────────────────────────────────────── */}
        {menus.length === 0 ? (
          <Card className="p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('admin.dishes.empty.title')}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t('admin.dishes.empty.description')}</p>
            <Button onClick={() => { setEditingMenu(null); setShowMenuModal(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.dishes.addMenu')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map((menu, i) => {
              const colors = MENU_COLORS[i % MENU_COLORS.length]
              const letter = MENU_LETTERS[i % MENU_LETTERS.length]
              const assigned = menuAssignedCount[menu.id] || 0
              return (
                <Card key={menu.id} className="overflow-hidden flex flex-col">
                  {/* Color stripe + image */}
                  {menu.image_url ? (
                    <div className="relative h-32 bg-muted flex-shrink-0">
                      <Image src={menu.image_url} alt={menu.name} fill className="object-cover" />
                      <div className={`absolute top-3 left-3 w-7 h-7 rounded-full ${colors.stripe} text-white text-xs font-bold flex items-center justify-center shadow`}>
                        {letter}
                      </div>
                    </div>
                  ) : (
                    <div className={`h-2 flex-shrink-0 ${colors.stripe}`} />
                  )}

                  <div className="p-4 flex flex-col flex-1 gap-3">
                    {/* Header */}
                    <div className="flex items-start gap-2">
                      {!menu.image_url && (
                        <div className={`w-7 h-7 rounded-full ${colors.stripe} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {letter}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight">{menu.name}</h3>
                        {menu.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{menu.description}</p>
                        )}
                      </div>
                      {/* Assignment count */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${colors.badge}`}>
                        <Users className="w-3 h-3" />
                        {assigned}
                      </span>
                    </div>

                    {/* Courses */}
                    {menu.courses && menu.courses.length > 0 && (
                      <div className="space-y-1.5">
                        {menu.courses.map(course => (
                          <div key={course.id} className="flex items-baseline gap-2 text-sm">
                            <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[9px] font-semibold flex items-center justify-center flex-shrink-0 translate-y-[1px]">
                              {course.course_number}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {course.course_name || `${t('admin.dishes.course')} ${course.course_number}`}
                            </span>
                            {course.dish_name && (
                              <>
                                <span className="text-muted-foreground/40 text-xs shrink-0">·</span>
                                <span className="text-xs font-medium truncate">{course.dish_name}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 mt-auto pt-2 border-t border-border">
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => { setEditingMenu(menu); setShowMenuModal(true) }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingMenuId(menu.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Add menu card */}
            <button
              onClick={() => { setEditingMenu(null); setShowMenuModal(true) }}
              className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 min-h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-medium">{t('admin.dishes.addMenu')}</span>
            </button>
          </div>
        )}

        {/* ── Assignments section ─────────────────────────────────────────────── */}
        {menus.length > 0 && (
          <div>
            {/* Header row: title + legend */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold">{t('admin.dishes.guestAssignments')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {totalAssigned}/{confirmedGuests.length} {t('admin.dishes.stats.assigned').toLowerCase()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {menus.map((menu, i) => {
                  const colors = MENU_COLORS[i % MENU_COLORS.length]
                  return (
                    <span key={menu.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                      <span className="font-bold">{MENU_LETTERS[i]}</span>
                      <span className="hidden sm:inline">{menu.name}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg w-fit">
              {(['guests', 'group', 'table'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'guests' ? t('admin.dishes.byGuests')
                    : tab === 'group' ? t('admin.dishes.byGroup')
                    : t('admin.dishes.byTable')}
                </button>
              ))}
            </div>

            {/* ── By Guests ── */}
            {activeTab === 'guests' && (
              <>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('admin.dishes.searchGuests')}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button
                    variant={showAllGuests ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAllGuests(p => !p)}
                    className="h-9 gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{showAllGuests ? t('admin.dishes.confirmedOnly') : t('admin.dishes.showAllGuests')}</span>
                  </Button>
                </div>

                {displayGuests.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground text-sm">
                    {t('admin.dishes.noGuestsFound')}
                  </Card>
                ) : (
                  <Card className="divide-y overflow-hidden">
                    {displayGuests.map(guest => {
                      const assignedMenuId = assignmentMap[guest.id]
                      const isConfirmed = guest.confirmation_status === 'confirmed'
                      return (
                        <div
                          key={guest.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20 ${!isConfirmed ? 'opacity-60' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            assignedMenuId ? MENU_COLORS[menus.findIndex(m => m.id === assignedMenuId) % MENU_COLORS.length].stripe : 'bg-muted'
                          }`}>
                            {assignedMenuId && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm">{guest.name}</span>
                            {guest.groupName && (
                              <span className="text-xs text-muted-foreground ml-2">{guest.groupName}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {menus.map((menu, i) => {
                              const isAssigned = assignedMenuId === menu.id
                              const colors = MENU_COLORS[i % MENU_COLORS.length]
                              return (
                                <button
                                  key={menu.id}
                                  onClick={() => handleToggleAssignment(guest.id, menu.id)}
                                  className={`w-7 h-7 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                                    isAssigned ? colors.pill : colors.ghost
                                  }`}
                                  title={menu.name}
                                >
                                  {MENU_LETTERS[i]}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </Card>
                )}
              </>
            )}

            {/* ── By Group ── */}
            {activeTab === 'group' && (
              <>
                {groups.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground text-sm">
                    {t('admin.dishes.noGroups')}
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {groups.map(group => {
                      const groupGuests = confirmedGuests.filter(g => g.guest_group_id === group.id)
                      if (groupGuests.length === 0) return null
                      const unassigned = groupGuests.filter(g => !assignmentMap[g.id]).length
                      return (
                        <Card key={group.id} className="px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{group.name}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">{groupGuests.length} {t('admin.dishes.members')}</span>
                              {menus.map((menu, i) => {
                                const count = groupGuests.filter(g => assignmentMap[g.id] === menu.id).length
                                if (count === 0) return null
                                const colors = MENU_COLORS[i % MENU_COLORS.length]
                                return (
                                  <span key={menu.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors.badge}`}>
                                    {MENU_LETTERS[i]}: {count}
                                  </span>
                                )
                              })}
                              {unassigned > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                                  {unassigned} {t('admin.dishes.stats.unassigned').toLowerCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {menus.map((menu, i) => {
                              const colors = MENU_COLORS[i % MENU_COLORS.length]
                              const allAssigned = groupGuests.every(g => assignmentMap[g.id] === menu.id)
                              return (
                                <button
                                  key={menu.id}
                                  onClick={() => handleBulkAssign(menu.id, { groupId: group.id })}
                                  disabled={saving}
                                  className={`w-8 h-8 rounded-full text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 ${
                                    allAssigned ? colors.pill : colors.ghost
                                  }`}
                                  title={menu.name}
                                >
                                  {MENU_LETTERS[i]}
                                </button>
                              )
                            })}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── By Table ── */}
            {activeTab === 'table' && (
              <>
                {tables.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground text-sm">
                    {t('admin.dishes.noTables')}
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {tables.map(table => {
                      const guestIds = tableGuestMap[table.id] || []
                      const tableGuests = guests.filter(g => guestIds.includes(g.id))
                      if (tableGuests.length === 0) return null
                      const unassigned = tableGuests.filter(g => !assignmentMap[g.id]).length
                      return (
                        <Card key={table.id} className="px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{table.name}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">{tableGuests.length} {t('admin.dishes.members')}</span>
                              {menus.map((menu, i) => {
                                const count = tableGuests.filter(g => assignmentMap[g.id] === menu.id).length
                                if (count === 0) return null
                                const colors = MENU_COLORS[i % MENU_COLORS.length]
                                return (
                                  <span key={menu.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors.badge}`}>
                                    {MENU_LETTERS[i]}: {count}
                                  </span>
                                )
                              })}
                              {unassigned > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                                  {unassigned} {t('admin.dishes.stats.unassigned').toLowerCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {menus.map((menu, i) => {
                              const colors = MENU_COLORS[i % MENU_COLORS.length]
                              const allAssigned = tableGuests.every(g => assignmentMap[g.id] === menu.id)
                              return (
                                <button
                                  key={menu.id}
                                  onClick={() => handleBulkAssign(menu.id, { tableId: table.id })}
                                  disabled={saving}
                                  className={`w-8 h-8 rounded-full text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 ${
                                    allAssigned ? colors.pill : colors.ghost
                                  }`}
                                  title={menu.name}
                                >
                                  {MENU_LETTERS[i]}
                                </button>
                              )
                            })}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit menu modal */}
      <AddEditMenuModal
        open={showMenuModal}
        onClose={() => { setShowMenuModal(false); setEditingMenu(null) }}
        onSave={handleSaveMenu}
        menu={editingMenu}
        saving={saving}
      />

      {/* Confirm delete */}
      <ConfirmDeleteDialog
        isOpen={!!deletingMenuId}
        onConfirm={handleDeleteMenu}
        onCancel={() => setDeletingMenuId(null)}
        componentType={t('admin.dishes.menu')}
      />
    </main>
  )
}
