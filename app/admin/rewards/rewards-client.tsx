'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Gift, DollarSign, Bird } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface RewardsClientProps {
  rewards: any[]
}

export function RewardsClient({ rewards: initialRewards }: RewardsClientProps) {
  const [rewards, setRewards] = useState(initialRewards)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'free_item' as 'free_item' | 'discount' | 'bonus_ducks',
    value: '',
    duck_threshold: 10,
    expiry_days: 30,
    stock: null as number | null,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'free_item',
      value: '',
      duck_threshold: 10,
      expiry_days: 30,
      stock: null,
    })
  }

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reward')
      }

      toast({
        title: 'Success!',
        description: 'Reward created successfully',
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
    if (!editingReward) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/rewards/${editingReward.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update reward')
      }

      toast({
        title: 'Success!',
        description: 'Reward updated successfully',
      })

      resetForm()
      setEditingReward(null)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete reward')
      }

      toast({
        title: 'Success',
        description: 'Reward deleted successfully',
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

  const openEdit = (reward: any) => {
    setFormData({
      name: reward.name,
      description: reward.description || '',
      type: reward.type,
      value: reward.value,
      duck_threshold: reward.duck_threshold,
      expiry_days: reward.expiry_days || 30,
      stock: reward.stock,
    })
    setEditingReward(reward)
  }

  const toggleActive = async (reward: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/rewards/${reward.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reward, active: !reward.active }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle reward')
      }

      toast({
        title: 'Success',
        description: `Reward ${!reward.active ? 'activated' : 'deactivated'}`,
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reward Management</h1>
          <p className="text-muted-foreground">Create and manage rewards</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Reward
        </Button>
      </div>

      {/* Rewards List */}
      <div className="grid gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className={!reward.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {reward.type === 'free_item' && <Gift className="w-5 h-5" />}
                    {reward.type === 'discount' && <DollarSign className="w-5 h-5" />}
                    {reward.type === 'bonus_ducks' && <Bird className="w-5 h-5" />}
                    {reward.name}
                    {!reward.active && (
                      <span className="text-xs bg-grey-light px-2 py-1 rounded">Inactive</span>
                    )}
                  </CardTitle>
                  <CardDescription>{reward.description}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-penkey-orange">{reward.value}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="ml-2 font-medium">{reward.duck_threshold} ducks</span>
                  </div>
                  {reward.expiry_days && (
                    <div>
                      <span className="text-muted-foreground">Expiry:</span>
                      <span className="ml-2 font-medium">{reward.expiry_days} days</span>
                    </div>
                  )}
                  {reward.stock !== null && (
                    <div>
                      <span className="text-muted-foreground">Stock:</span>
                      <span className="ml-2 font-medium">{reward.stock}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(reward)}
                    disabled={isLoading}
                  >
                    {reward.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(reward)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(reward.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rewards.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No rewards yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Reward
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingReward} onOpenChange={() => {
        setIsCreateOpen(false)
        setEditingReward(null)
        resetForm()
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
            <DialogDescription>
              {editingReward ? 'Update reward details' : 'Add a new reward for customers'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Reward Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Free Coffee"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Enjoy any coffee on the house"
              />
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="free_item">Free Item</option>
                <option value="discount">Discount</option>
                <option value="bonus_ducks">Bonus Ducks</option>
              </select>
            </div>

            <div>
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., Free Coffee, 10%, 5"
              />
            </div>

            <div>
              <Label htmlFor="threshold">Duck Threshold *</Label>
              <Input
                id="threshold"
                type="number"
                value={formData.duck_threshold}
                onChange={(e) => setFormData({ ...formData, duck_threshold: parseInt(e.target.value) || 10 })}
              />
            </div>

            <div>
              <Label htmlFor="expiry">Expiry Days (optional)</Label>
              <Input
                id="expiry"
                type="number"
                value={formData.expiry_days || ''}
                onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) || 30 })}
                placeholder="Leave empty for no expiry"
              />
            </div>

            <div>
              <Label htmlFor="stock">Stock Limit (optional)</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <Button
              onClick={editingReward ? handleUpdate : handleCreate}
              disabled={isLoading || !formData.name || !formData.value}
              className="w-full"
            >
              {isLoading ? 'Saving...' : editingReward ? 'Update Reward' : 'Create Reward'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
