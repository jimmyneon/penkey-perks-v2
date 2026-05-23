'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, TrendingUp, Users, Award, Clock, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface PointsConfig {
  id: string
  action_type: string
  points_amount: number
  description: string
  active: boolean
  min_interval_hours: number | null
  max_per_day: number | null
  requires_verification: boolean
  metadata: any
  unique_users: number
  total_uses: number
  total_points_awarded: number
  last_used: string | null
  created_at: string
  updated_at: string
}

interface PointsConfigClientProps {
  pointsConfigs: PointsConfig[]
}

export function PointsConfigClient({ pointsConfigs: initialConfigs }: PointsConfigClientProps) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PointsConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    action_type: '',
    points_amount: 5,
    description: '',
    min_interval_hours: null as number | null,
    max_per_day: null as number | null,
    requires_verification: false,
  })

  const resetForm = () => {
    setFormData({
      action_type: '',
      points_amount: 5,
      description: '',
      min_interval_hours: null,
      max_per_day: null,
      requires_verification: false,
    })
  }

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/points-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create beans config')
      }

      toast({
        title: 'Success!',
        description: 'Beans configuration created successfully',
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
    if (!editingConfig) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/points-config/${editingConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update beans config')
      }

      toast({
        title: 'Success!',
        description: 'Beans configuration updated successfully',
      })

      resetForm()
      setEditingConfig(null)
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

  const openEdit = (config: PointsConfig) => {
    setFormData({
      action_type: config.action_type,
      points_amount: config.points_amount,
      description: config.description,
      min_interval_hours: config.min_interval_hours,
      max_per_day: config.max_per_day,
      requires_verification: config.requires_verification,
    })
    setEditingConfig(config)
  }

  const toggleActive = async (config: PointsConfig) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/points-config/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: config.action_type,
          points_amount: config.points_amount,
          description: config.description,
          min_interval_hours: config.min_interval_hours,
          max_per_day: config.max_per_day,
          requires_verification: config.requires_verification,
          active: !config.active,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle beans config')
      }

      toast({
        title: 'Success',
        description: `Beans action ${!config.active ? 'activated' : 'deactivated'}`,
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

  // Calculate totals
  const totalPoints = configs.reduce((sum, c) => sum + (c.total_points_awarded || 0), 0)
  const totalUses = configs.reduce((sum, c) => sum + (c.total_uses || 0), 0)
  const activeConfigs = configs.filter(c => c.active).length

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beans Configuration</h1>
          <p className="text-muted-foreground">Manage bean awards and rewards</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Configs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-muted-foreground">{activeConfigs} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Beans Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-penkey-orange">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Uses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Beans/Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUses > 0 ? Math.round(totalPoints / totalUses) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per use</p>
          </CardContent>
        </Card>
      </div>

      {/* Configs List */}
      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id} className={!config.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm bg-penkey-orange/10 px-2 py-1 rounded text-penkey-orange">
                      {config.action_type}
                    </code>
                    {!config.active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {config.requires_verification && (
                      <Badge variant="outline">Requires Verification</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">{config.description}</CardDescription>
                </div>
                <div className="text-right ml-4">
                  <p className="text-3xl font-bold text-penkey-orange">
                    {config.points_amount}
                  </p>
                  <p className="text-xs text-muted-foreground">beans</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Limits & Cooldowns */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {config.min_interval_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cooldown:</span>
                      <span className="font-medium">{config.min_interval_hours}h</span>
                    </div>
                  )}
                  {config.max_per_day && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Max/day:</span>
                      <span className="font-medium">{config.max_per_day}</span>
                    </div>
                  )}
                  {!config.min_interval_hours && !config.max_per_day && (
                    <span className="text-muted-foreground text-xs">No limits</span>
                  )}
                </div>

                {/* Usage Stats */}
                {config.total_uses > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Users className="w-3 h-3" />
                        Unique Users
                      </div>
                      <p className="text-lg font-semibold">{config.unique_users}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Total Uses
                      </div>
                      <p className="text-lg font-semibold">{config.total_uses}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Award className="w-3 h-3" />
                        Beans Awarded
                      </div>
                      <p className="text-lg font-semibold text-penkey-orange">
                        {config.total_points_awarded}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    {config.last_used ? (
                      <>Last used: {new Date(config.last_used).toLocaleDateString()}</>
                    ) : (
                      <>Never used</>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(config)}
                      disabled={isLoading}
                    >
                      {config.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(config)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {configs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No beans configurations yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Config
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingConfig} onOpenChange={() => {
        setIsCreateOpen(false)
        setEditingConfig(null)
        resetForm()
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit Beans Config' : 'Create Beans Config'}</DialogTitle>
            <DialogDescription>
              {editingConfig ? 'Update beans configuration' : 'Add a new beans action'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="action_type">Action Type *</Label>
              <Input
                id="action_type"
                value={formData.action_type}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                placeholder="e.g., daily_checkin, referral_signup"
                disabled={!!editingConfig}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use snake_case (e.g., daily_checkin, game_win_small)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Daily visit check-in at shop"
              />
            </div>

            <div>
              <Label htmlFor="points_amount">Beans Amount *</Label>
              <Input
                id="points_amount"
                type="number"
                value={formData.points_amount}
                onChange={(e) => setFormData({ ...formData, points_amount: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="min_interval_hours">Cooldown (hours)</Label>
              <Input
                id="min_interval_hours"
                type="number"
                value={formData.min_interval_hours || ''}
                onChange={(e) => setFormData({ ...formData, min_interval_hours: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Leave empty for no cooldown"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum hours between uses (e.g., 24 for daily)
              </p>
            </div>

            <div>
              <Label htmlFor="max_per_day">Max Per Day</Label>
              <Input
                id="max_per_day"
                type="number"
                value={formData.max_per_day || ''}
                onChange={(e) => setFormData({ ...formData, max_per_day: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Leave empty for unlimited"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum times per day (e.g., 1 for once daily)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_verification"
                checked={formData.requires_verification}
                onChange={(e) => setFormData({ ...formData, requires_verification: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="requires_verification" className="cursor-pointer">
                Requires staff verification
              </Label>
            </div>

            <Button
              onClick={editingConfig ? handleUpdate : handleCreate}
              disabled={isLoading || !formData.action_type || !formData.description}
              className="w-full"
            >
              {isLoading ? 'Saving...' : editingConfig ? 'Update Config' : 'Create Config'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
