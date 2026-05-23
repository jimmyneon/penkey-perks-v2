'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye } from 'lucide-react'
import { ConditionsBuilder } from './conditions-builder'
import { NotificationPreview } from './notification-preview'

interface NotificationFormProps {
  mode: 'create' | 'edit'
  initialData?: any
}

interface FormData {
  type: string
  priority: number
  title: string
  message: string
  icon: string
  conditions: Record<string, any>
  variant: string
  dismissible: boolean
  startDate: string
  endDate: string
  targetAudience: string
  minPoints: number | null
  maxPoints: number | null
}

export function NotificationForm({ mode, initialData }: NotificationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    type: initialData?.type || 'custom',
    priority: initialData?.priority || 10,
    title: initialData?.title || '',
    message: initialData?.message || '',
    icon: initialData?.icon || '📢',
    conditions: initialData?.conditions || {},
    variant: initialData?.variant || 'default',
    dismissible: initialData?.dismissible ?? true,
    startDate: initialData?.start_date || '',
    endDate: initialData?.end_date || '',
    targetAudience: initialData?.target_audience || 'all',
    minPoints: initialData?.min_points || null,
    maxPoints: initialData?.max_points || null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = mode === 'create' 
        ? '/api/admin/notifications/create'
        : '/api/admin/notifications/update'

      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(mode === 'edit' && { id: initialData?.id })
        })
      })

      if (!response.ok) throw new Error('Failed to save notification')

      toast({
        title: 'Success!',
        description: `Notification ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })

      router.push('/admin/notifications')
      router.refresh()

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notification',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preview Dialog */}
      {showPreview && (
        <NotificationPreview
          data={formData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about the notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => updateField('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reward">Reward</SelectItem>
                  <SelectItem value="streak">Streak</SelectItem>
                  <SelectItem value="checkin">Check-in</SelectItem>
                  <SelectItem value="stamp">Stamp</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority (1 = highest)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => updateField('priority', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., 🎉 Rewards Ready!"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="e.g., You've got treats waiting! Pop in and redeem them!"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500">
              Tip: Use {'{'}variable{'}'} for dynamic content (e.g., {'{'}currentStreak{'}'})
            </p>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => updateField('icon', e.target.value)}
              placeholder="e.g., 🎁"
              maxLength={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>How the notification appears</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variant */}
          <div className="space-y-2">
            <Label htmlFor="variant">Variant</Label>
            <Select value={formData.variant} onValueChange={(value) => updateField('variant', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Orange)</SelectItem>
                <SelectItem value="reward">Reward (Yellow)</SelectItem>
                <SelectItem value="streak">Streak (Red/Orange - Pulsing)</SelectItem>
                <SelectItem value="success">Success (Green)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dismissible */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dismissible</Label>
              <p className="text-sm text-gray-500">Allow users to close this notification</p>
            </div>
            <Switch
              checked={formData.dismissible}
              onCheckedChange={(checked) => updateField('dismissible', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
          <CardDescription>When should this notification appear?</CardDescription>
        </CardHeader>
        <CardContent>
          <ConditionsBuilder
            conditions={formData.conditions}
            onChange={(conditions) => updateField('conditions', conditions)}
          />
        </CardContent>
      </Card>

      {/* Scheduling (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling (Optional)</CardTitle>
          <CardDescription>Limit when this notification is active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Targeting (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Targeting (Optional)</CardTitle>
          <CardDescription>Who should see this notification?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Select value={formData.targetAudience} onValueChange={(value) => updateField('targetAudience', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="new">New Users (&lt; 7 days)</SelectItem>
                <SelectItem value="returning">Returning Users</SelectItem>
                <SelectItem value="vip">VIP Users (High Points)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPoints">Min Points</Label>
              <Input
                id="minPoints"
                type="number"
                value={formData.minPoints || ''}
                onChange={(e) => updateField('minPoints', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No minimum"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPoints">Max Points</Label>
              <Input
                id="maxPoints"
                type="number"
                value={formData.maxPoints || ''}
                onChange={(e) => updateField('maxPoints', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No maximum"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === 'create' ? 'Create Notification' : 'Update Notification'}
        </Button>

        <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>

        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
