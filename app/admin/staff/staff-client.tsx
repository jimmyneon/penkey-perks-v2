'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Shield, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface StaffClientProps {
  staff: any[]
}

export function StaffClient({ staff: initialStaff }: StaffClientProps) {
  const [staff, setStaff] = useState(initialStaff)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'employee' as 'owner' | 'employee',
  })

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'employee',
    })
  }

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add staff member')
      }

      toast({
        title: 'Success!',
        description: 'Staff member added successfully',
      })

      resetForm()
      setIsCreateOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingStaff) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: formData.role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff member')
      }

      toast({
        title: 'Success!',
        description: 'Staff member updated successfully',
      })

      resetForm()
      setEditingStaff(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from staff?`)) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove staff member')
      }

      toast({
        title: 'Success',
        description: 'Staff member removed successfully',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (staffMember: any) => {
    setFormData({
      email: staffMember.users.email,
      name: staffMember.users.name,
      role: staffMember.role,
    })
    setEditingStaff(staffMember)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage admin and employee access</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff List */}
      <div className="grid gap-4">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    member.role === 'owner' ? 'bg-penkey-orange' : 'bg-penkey-orange'
                  }`}>
                    {member.role === 'owner' ? (
                      <Shield className="w-6 h-6 text-text-dark" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{member.users.name}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        member.role === 'owner' 
                          ? 'bg-penkey-orange text-text-dark' 
                          : 'bg-penkey-orange text-white'
                      }`}>
                        {member.role === 'owner' ? 'Owner' : 'Employee'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.users.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(member)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(member.id, member.users.name)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {staff.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No staff members yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Staff Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role Info */}
      <Card className="bg-blue-50 border-penkey-orange">
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong className="text-penkey-orange">👑 Owner:</strong> Full access to all features including staff management
          </div>
          <div>
            <strong className="text-penkey-orange">👤 Employee:</strong> Can manage customers, rewards, and view logs (no staff management)
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingStaff} onOpenChange={() => {
        setIsCreateOpen(false)
        setEditingStaff(null)
        resetForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff 
                ? 'Update staff member role' 
                : 'Add a new staff member to your team'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingStaff && (
              <>
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@penkey.co.uk"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    They'll need to sign up with this email
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="employee">Employee</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <Button
              onClick={editingStaff ? handleUpdate : handleCreate}
              disabled={isLoading || (!editingStaff && (!formData.email || !formData.name))}
              className="w-full"
            >
              {isLoading ? 'Saving...' : editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
