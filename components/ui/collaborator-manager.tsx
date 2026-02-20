"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Trash2, Users, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useCollaborators } from '@/hooks/use-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

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
  const { collaboratorEmails, loading: collaboratorsLoading, addCollaborator, removeCollaborator } = useCollaborators(weddingNameId)
  
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('')
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null)
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  const [expandedCollaborator, setExpandedCollaborator] = useState<string | null>(null)
  const [collaboratorsWithPerms, setCollaboratorsWithPerms] = useState<CollaboratorWithPermissions[]>([])
  const [loadingPerms, setLoadingPerms] = useState<Record<string, boolean>>({})
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // New collaborator permissions state
  const [newCollabPerms, setNewCollabPerms] = useState<CollaboratorPermissions>({
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
    can_manage_collaborators: false
  })

  // Fetch permissions for all collaborators
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
    
    // Add collaborator
    const result = await addCollaborator(newCollaboratorEmail.trim())
    
    if (result.success) {
      // Set permissions
      try {
        const response = await fetch(
          `/api/weddings/${weddingNameId}/collaborators/${encodeURIComponent(newCollaboratorEmail.trim())}/permissions`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCollabPerms)
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to set permissions')
        }
        
        toast.success('Collaborator added successfully', {
          description: `${newCollaboratorEmail.trim()} has been added with the selected permissions.`
        })
        
        setNewCollaboratorEmail('')
        // Reset to default permissions
        setNewCollabPerms({
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
          can_manage_collaborators: false
        })
      } catch (error) {
        setCollaboratorError('Collaborator added but failed to set permissions')
        toast.error('Failed to set permissions', {
          description: 'The collaborator was added but permissions could not be set.'
        })
      }
    } else {
      setCollaboratorError(result.error || 'Failed to add collaborator')
      toast.error('Failed to add collaborator', {
        description: result.error || 'Please try again.'
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
          body: JSON.stringify(newPerms)
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to update permissions')
      }
      
      // Update local state
      setCollaboratorsWithPerms(prev =>
        prev.map(c => c.email === email ? { ...c, permissions: { ...c.permissions, ...newPerms } } : c)
      )
      
      toast.success('Permissions updated', {
        description: `Updated permissions for ${email}`
      })
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions', {
        description: 'Please try again.'
      })
    } finally {
      setLoadingPerms(prev => ({ ...prev, [email]: false }))
    }
  }

  const PermissionCheckboxes = ({ 
    permissions, 
    onUpdate 
  }: { 
    permissions: CollaboratorPermissions
    onUpdate: (perms: Partial<CollaboratorPermissions>) => void 
  }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Details & Design */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Page Management</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_edit_details}
              onChange={(e) => onUpdate({ can_edit_details: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Edit wedding details</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_edit_page_design}
              onChange={(e) => onUpdate({ can_edit_page_design: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Edit page design</span>
          </label>
        </div>

        {/* Guests */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Guest List</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_view_guests}
              onChange={(e) => onUpdate({ can_view_guests: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">View guests</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_manage_guests}
              onChange={(e) => onUpdate({ can_manage_guests: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Manage guests</span>
          </label>
        </div>

        {/* Invitations */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Invitations</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_view_invitations}
              onChange={(e) => onUpdate({ can_view_invitations: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">View invitations</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_manage_invitations}
              onChange={(e) => onUpdate({ can_manage_invitations: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Send invitations</span>
          </label>
        </div>

        {/* RSVPs */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">RSVPs</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_view_rsvps}
              onChange={(e) => onUpdate({ can_view_rsvps: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">View RSVPs</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_manage_rsvps}
              onChange={(e) => onUpdate({ can_manage_rsvps: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Edit RSVPs</span>
          </label>
        </div>

        {/* Registry */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Registry</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_view_registry}
              onChange={(e) => onUpdate({ can_view_registry: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">View registry</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_manage_registry}
              onChange={(e) => onUpdate({ can_manage_registry: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Manage registry</span>
          </label>
        </div>

        {/* Gallery */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Gallery</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_view_gallery}
              onChange={(e) => onUpdate({ can_view_gallery: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">View gallery</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissions.can_manage_gallery}
              onChange={(e) => onUpdate({ can_manage_gallery: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Manage photos</span>
          </label>
        </div>
      </div>

      {/* Collaborators Management */}
      <div className="pt-2 border-t">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={permissions.can_manage_collaborators}
            onChange={(e) => onUpdate({ can_manage_collaborators: e.target.checked })}
            className="rounded"
          />
          <span className="text-gray-700 font-medium">Can manage other collaborators</span>
        </label>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Share with Wedding Planner or Collaborators</h3>
        <p className="text-xs text-blue-700">
          Add collaborators and customize their permissions. By default, they can view everything but not make changes.
        </p>
      </div>

      {/* Add Collaborator Form */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Collaborator by Email
        </label>
        <form onSubmit={handleAddCollaborator} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="planner@email.com"
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
              Add
            </Button>
          </div>

          {/* Permission settings for new collaborator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-700">Permissions</h4>
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

      {/* Collaborators List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Current Collaborators
        </h3>
        
        {collaboratorsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : collaboratorEmails.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No collaborators yet</p>
            <p className="text-xs text-gray-400 mt-1">Add someone above to share access</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaboratorsWithPerms.map(({ email, permissions }) => (
              <div 
                key={email}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{email}</p>
                    <p className="text-xs text-gray-500">
                      {permissions.can_edit_details || permissions.can_manage_guests ? 'Editor' : 'Viewer'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedCollaborator(expandedCollaborator === email ? null : email)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit permissions"
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
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove collaborator"
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
                      <div className="p-4 bg-white border-t border-gray-200">
                        {loadingPerms[email] ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 h-5 border-b-2 border-blue-600"></div>
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
            toast.success('Collaborator removed', {
              description: `${emailToDelete} has been removed from this wedding.`
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
