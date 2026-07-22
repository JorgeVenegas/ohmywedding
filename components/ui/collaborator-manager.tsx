"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { UserPlus, Trash2, Users, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useCollaborators } from '@/hooks/use-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { useI18n } from '@/components/contexts/i18n-context'

interface CollaboratorPermissions {
  can_edit_details: boolean
  can_edit_page_design: boolean
  can_manage_guests: boolean
  can_view_guests: boolean
  can_manage_invitations: boolean
  can_view_invitations: boolean
  can_manage_registry: boolean
  can_view_registry: boolean
  can_manage_gallery: boolean
  can_view_gallery: boolean
  can_manage_rsvps: boolean
  can_view_rsvps: boolean
  can_manage_collaborators: boolean
}

interface CollaboratorWithPermissions {
  email: string
  permissions: CollaboratorPermissions
}

interface CollaboratorManagerProps {
  weddingNameId: string
}

export function CollaboratorManager({ weddingNameId }: CollaboratorManagerProps) {
  const { t } = useI18n()
  const { collaboratorEmails, loading: collaboratorsLoading, addCollaborator, removeCollaborator } = useCollaborators(weddingNameId)

  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('')
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null)
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  const [expandedCollaborator, setExpandedCollaborator] = useState<string | null>(null)
  const [collaboratorsWithPerms, setCollaboratorsWithPerms] = useState<CollaboratorWithPermissions[]>([])
  const [loadingPerms, setLoadingPerms] = useState<Record<string, boolean>>({})
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const defaultPerms: CollaboratorPermissions = {
    can_edit_details: false,
    can_edit_page_design: false,
    can_manage_guests: false,
    can_view_guests: true,
    can_manage_invitations: false,
    can_view_invitations: true,
    can_manage_registry: false,
    can_view_registry: true,
    can_manage_gallery: false,
    can_view_gallery: true,
    can_manage_rsvps: false,
    can_view_rsvps: true,
    can_manage_collaborators: false,
  }

  const [newCollabPerms, setNewCollabPerms] = useState<CollaboratorPermissions>(defaultPerms)

  useEffect(() => {
    async function fetchAllPermissions() {
      const perms: CollaboratorWithPermissions[] = []
      for (const email of collaboratorEmails) {
        try {
          const response = await fetch(`/api/weddings/${weddingNameId}/collaborators/${encodeURIComponent(email)}/permissions`)
          if (response.ok) {
            const data = await response.json()
            perms.push({ email, permissions: data })
          }
        } catch (err) {
          console.error(`Failed to fetch permissions for ${email}:`, err)
        }
      }
      setCollaboratorsWithPerms(perms)
    }

    if (collaboratorEmails.length > 0) {
      fetchAllPermissions()
    } else {
      setCollaboratorsWithPerms([])
    }
  }, [collaboratorEmails, weddingNameId])

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollaboratorEmail.trim()) return

    setIsAddingCollaborator(true)
    setCollaboratorError(null)

    const result = await addCollaborator(newCollaboratorEmail.trim())

    if (result.success) {
      try {
        const response = await fetch(
          `/api/weddings/${weddingNameId}/collaborators/${encodeURIComponent(newCollaboratorEmail.trim())}/permissions`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCollabPerms),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to set permissions')
        }

        toast.success(t('admin.settings.collaborators.toasts.added'), {
          description: t('admin.settings.collaborators.toasts.addedDescription').replace('{{email}}', newCollaboratorEmail.trim()),
        })

        setNewCollaboratorEmail('')
        setNewCollabPerms(defaultPerms)
      } catch (error) {
        setCollaboratorError(t('admin.settings.collaborators.errors.failedPermsSaved'))
        toast.error(t('admin.settings.collaborators.toasts.failedToSetPerms'), {
          description: t('admin.settings.collaborators.toasts.failedToSetPermsDesc'),
        })
      }
    } else {
      setCollaboratorError(result.error || t('admin.settings.collaborators.toasts.failedToAdd'))
      toast.error(t('admin.settings.collaborators.toasts.failedToAdd'), {
        description: t('admin.settings.collaborators.toasts.tryAgain'),
      })
    }

    setIsAddingCollaborator(false)
  }

  const updatePermissions = async (email: string, newPerms: Partial<CollaboratorPermissions>) => {
    setLoadingPerms(prev => ({ ...prev, [email]: true }))

    try {
      const response = await fetch(
        `/api/weddings/${weddingNameId}/collaborators/${encodeURIComponent(email)}/permissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPerms),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update permissions')
      }

      setCollaboratorsWithPerms(prev =>
        prev.map(c => c.email === email ? { ...c, permissions: { ...c.permissions, ...newPerms } } : c)
      )

      toast.success(t('admin.settings.collaborators.toasts.permissionsUpdated'), {
        description: t('admin.settings.collaborators.toasts.permissionsUpdatedFor').replace('{{email}}', email),
      })
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error(t('admin.settings.collaborators.toasts.failedToUpdatePermissions'), {
        description: t('admin.settings.collaborators.toasts.tryAgain'),
      })
    } finally {
      setLoadingPerms(prev => ({ ...prev, [email]: false }))
    }
  }

  const PermissionRow = ({
    label,
    checked,
    onChange,
  }: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#420c14]/80">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )

  const PermissionCheckboxes = ({
    permissions,
    onUpdate,
  }: {
    permissions: CollaboratorPermissions
    onUpdate: (perms: Partial<CollaboratorPermissions>) => void
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDA46F] mb-1">{t('admin.settings.collaborators.permissionGroups.page')}</p>
          <div className="divide-y divide-border/50">
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.editDetails')} checked={permissions.can_edit_details} onChange={(v) => onUpdate({ can_edit_details: v })} />
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.editPageDesign')} checked={permissions.can_edit_page_design} onChange={(v) => onUpdate({ can_edit_page_design: v })} />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDA46F] mb-1">{t('admin.settings.collaborators.permissionGroups.guestList')}</p>
          <div className="divide-y divide-border/50">
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.viewGuests')} checked={permissions.can_view_guests} onChange={(v) => onUpdate({ can_view_guests: v })} />
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.manageGuests')} checked={permissions.can_manage_guests} onChange={(v) => onUpdate({ can_manage_guests: v })} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDA46F] mb-1">{t('admin.settings.collaborators.permissionGroups.invitations')}</p>
          <div className="divide-y divide-border/50">
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.viewInvitations')} checked={permissions.can_view_invitations} onChange={(v) => onUpdate({ can_view_invitations: v })} />
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.sendInvitations')} checked={permissions.can_manage_invitations} onChange={(v) => onUpdate({ can_manage_invitations: v })} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDA46F] mb-1">{t('admin.settings.collaborators.permissionGroups.rsvps')}</p>
          <div className="divide-y divide-border/50">
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.viewRsvps')} checked={permissions.can_view_rsvps} onChange={(v) => onUpdate({ can_view_rsvps: v })} />
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.editRsvps')} checked={permissions.can_manage_rsvps} onChange={(v) => onUpdate({ can_manage_rsvps: v })} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDA46F] mb-1">{t('admin.settings.collaborators.permissionGroups.registry')}</p>
          <div className="divide-y divide-border/50">
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.viewRegistry')} checked={permissions.can_view_registry} onChange={(v) => onUpdate({ can_view_registry: v })} />
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.manageRegistry')} checked={permissions.can_manage_registry} onChange={(v) => onUpdate({ can_manage_registry: v })} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDA46F] mb-1">{t('admin.settings.collaborators.permissionGroups.gallery')}</p>
          <div className="divide-y divide-border/50">
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.viewGallery')} checked={permissions.can_view_gallery} onChange={(v) => onUpdate({ can_view_gallery: v })} />
            <PermissionRow label={t('admin.settings.collaborators.permissionLabels.managePhotos')} checked={permissions.can_manage_gallery} onChange={(v) => onUpdate({ can_manage_gallery: v })} />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border/60">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[#420c14]">{t('admin.settings.collaborators.permissionLabels.manageCollaborators')}</p>
            <p className="text-xs text-[#420c14]/50">{t('admin.settings.collaborators.permissionLabels.manageCollaboratorsDesc')}</p>
          </div>
          <Switch
            checked={permissions.can_manage_collaborators}
            onCheckedChange={(v) => onUpdate({ can_manage_collaborators: v })}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-[#DDA46F]/6 border border-[#DDA46F]/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-[#420c14] mb-1">{t('admin.settings.collaborators.shareTitle')}</h3>
        <p className="text-xs text-[#420c14]/60">{t('admin.settings.collaborators.shareDescription')}</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#420c14]">
          {t('admin.settings.collaborators.addByEmail')}
        </label>
        <form onSubmit={handleAddCollaborator} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t('admin.settings.collaborators.emailPlaceholder')}
              value={newCollaboratorEmail}
              onChange={(e) => setNewCollaboratorEmail(e.target.value)}
              className="flex-1"
              disabled={isAddingCollaborator}
            />
            <Button
              type="submit"
              disabled={isAddingCollaborator || !newCollaboratorEmail.trim()}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {t('admin.settings.collaborators.addButton')}
            </Button>
          </div>

          <div className="rounded-xl border border-[#420c14]/8 bg-[#420c14]/3 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-[#420c14]/50" />
              <h4 className="text-sm font-medium text-[#420c14]">{t('admin.settings.collaborators.setPermissionsTitle')}</h4>
            </div>
            <PermissionCheckboxes
              permissions={newCollabPerms}
              onUpdate={(perms) => setNewCollabPerms(prev => ({ ...prev, ...perms }))}
            />
          </div>
        </form>
        {collaboratorError && (
          <p className="mt-2 text-sm text-red-600">{collaboratorError}</p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#420c14]/40 mb-3">
          {t('admin.settings.collaborators.currentCollaborators')}
        </p>

        {collaboratorsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#DDA46F]"></div>
          </div>
        ) : collaboratorEmails.length === 0 ? (
          <div className="text-center py-10 bg-[#420c14]/3 rounded-xl border border-[#420c14]/8">
            <Users className="w-9 h-9 text-[#420c14]/20 mx-auto mb-2" />
            <p className="text-sm text-[#420c14]/50">{t('admin.settings.collaborators.noCollaborators')}</p>
            <p className="text-xs text-[#420c14]/30 mt-1">{t('admin.settings.collaborators.noCollaboratorsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaboratorsWithPerms.map(({ email, permissions }) => (
              <div
                key={email}
                className="border border-[#420c14]/10 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-3.5 bg-[#420c14]/3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#420c14] truncate">{email}</p>
                    <p className="text-xs text-[#420c14]/50 mt-0.5">
                      {permissions.can_edit_details || permissions.can_manage_guests
                        ? t('admin.settings.collaborators.editorRole')
                        : t('admin.settings.collaborators.viewerRole')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => setExpandedCollaborator(expandedCollaborator === email ? null : email)}
                      className="p-1.5 text-[#420c14]/30 hover:text-[#420c14] hover:bg-[#420c14]/5 rounded-lg transition-colors"
                      title={t('admin.settings.collaborators.editPermissionsTooltip')}
                    >
                      {expandedCollaborator === email ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEmailToDelete(email)
                        setShowDeleteDialog(true)
                      }}
                      className="p-1.5 text-[#420c14]/30 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('admin.settings.collaborators.removeCollaboratorTooltip')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedCollaborator === email && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-background border-t border-[#420c14]/8">
                        {loadingPerms[email] ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#DDA46F]"></div>
                          </div>
                        ) : (
                          <PermissionCheckboxes
                            permissions={permissions}
                            onUpdate={(perms) => updatePermissions(email, perms)}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onConfirm={async () => {
          if (emailToDelete) {
            await removeCollaborator(emailToDelete)
            toast.success(t('admin.settings.collaborators.toasts.permissionsUpdated'), {
              description: `${emailToDelete} has been removed from this wedding.`,
            })
          }
          setShowDeleteDialog(false)
          setEmailToDelete(null)
        }}
        onCancel={() => {
          setShowDeleteDialog(false)
          setEmailToDelete(null)
        }}
        componentType="collaborator"
      />
    </div>
  )
}
