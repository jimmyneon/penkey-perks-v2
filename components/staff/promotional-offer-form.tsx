'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Gift, Sparkles, Send } from 'lucide-react'

interface PromotionalOfferFormProps {
  onSuccess?: () => void
}

export function PromotionalOfferForm({ onSuccess }: PromotionalOfferFormProps) {
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    terms: '',
    rewardType: 'free_item' as 'free_item' | 'discount' | 'bonus_beans' | 'custom',
    rewardValue: '',
    rewardDescription: '',
    icon: '🎁',
    buttonText: 'Redeem Now',
    redemptionLimit: 1,
    totalRedemptionLimit: null as number | null,
    voucherExpiryHours: 48,
    autoCreateVoucher: true,
    active: true,
    startDate: '',
    endDate: '',
    targetAudience: 'all' as 'all' | 'new' | 'returning' | 'vip',
    minBeans: null as number | null,
    maxBeans: null as number | null,
    priority: 10,
    showAsModal: true,
    showAsNotification: true
  })

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/staff/promotional-offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create promotional offer')
      }

      toast({
        title: '🎉 Promotional Offer Created!',
        description: 'Your offer is now live and will be shown to customers',
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        terms: '',
        rewardType: 'free_item',
        rewardValue: '',
        rewardDescription: '',
        icon: '🎁',
        buttonText: 'Redeem Now',
        redemptionLimit: 1,
        totalRedemptionLimit: null,
        voucherExpiryHours: 48,
        autoCreateVoucher: true,
        active: true,
        startDate: '',
        endDate: '',
        targetAudience: 'all',
        minBeans: null,
        maxBeans: null,
        priority: 10,
        showAsModal: true,
        showAsNotification: true
      })

      onSuccess?.()

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create promotional offer',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const offerTemplates = [
    {
      id: 'happy_hour',
      title: '🎉 Happy Hour - 20% Off',
      description: 'Happy Hour is NOW! Come grab your favorite coffee at 20% off for the next 2 hours!',
      rewardType: 'discount' as const,
      rewardValue: '20% off any drink',
      icon: '🎉'
    },
    {
      id: 'free_coffee',
      title: '☕ Free Coffee Voucher',
      description: 'Enjoy a FREE coffee on us! Valid for any regular size drink.',
      rewardType: 'free_item' as const,
      rewardValue: 'Free Regular Coffee',
      icon: '☕'
    },
    {
      id: 'bonus_beans',
      title: '🌟 Bonus Beans Boost',
      description: 'Get 50 bonus beans added to your account right now!',
      rewardType: 'bonus_beans' as const,
      rewardValue: '50 beans',
      icon: '🌟'
    },
    {
      id: 'bogo',
      title: '🎁 Buy One Get One Free',
      description: 'Buy any drink and get a second one FREE! Limited time offer.',
      rewardType: 'free_item' as const,
      rewardValue: 'BOGO - Free Second Drink',
      icon: '🎁'
    }
  ]

  const applyTemplate = (template: typeof offerTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      rewardType: template.rewardType,
      rewardValue: template.rewardValue,
      icon: template.icon
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Templates */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-950">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Quick Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {offerTemplates.map(template => (
              <Button
                key={template.id}
                type="button"
                variant="outline"
                className="h-auto p-3 text-left justify-start border-amber-300 hover:bg-amber-100"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">{template.title}</div>
                    <div className="text-xs text-amber-700 line-clamp-1">{template.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Details */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-950">Offer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., 🎉 Happy Hour - 20% Off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the offer to customers..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => updateField('icon', e.target.value)}
                placeholder="🎁"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) => updateField('buttonText', e.target.value)}
                placeholder="Redeem Now"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => updateField('terms', e.target.value)}
              placeholder="Optional terms and conditions..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reward Settings */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-950 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Reward Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rewardType">Reward Type *</Label>
              <Select 
                value={formData.rewardType} 
                onValueChange={(value: any) => updateField('rewardType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_item">Free Item</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="bonus_beans">Bonus Beans</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewardValue">Reward Value *</Label>
              <Input
                id="rewardValue"
                value={formData.rewardValue}
                onChange={(e) => updateField('rewardValue', e.target.value)}
                placeholder="e.g., Free Coffee, 20% off"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rewardDescription">Reward Description</Label>
            <Input
              id="rewardDescription"
              value={formData.rewardDescription}
              onChange={(e) => updateField('rewardDescription', e.target.value)}
              placeholder="Additional details about the reward..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Redemption Settings */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-950">Redemption Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="redemptionLimit">Per User Limit</Label>
              <Input
                id="redemptionLimit"
                type="number"
                min="1"
                value={formData.redemptionLimit}
                onChange={(e) => updateField('redemptionLimit', parseInt(e.target.value))}
              />
              <p className="text-xs text-amber-600">Max redemptions per user</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalRedemptionLimit">Total Limit</Label>
              <Input
                id="totalRedemptionLimit"
                type="number"
                min="1"
                value={formData.totalRedemptionLimit || ''}
                onChange={(e) => updateField('totalRedemptionLimit', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
              />
              <p className="text-xs text-amber-600">Total across all users</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucherExpiryHours">Voucher Expiry (hours)</Label>
            <Input
              id="voucherExpiryHours"
              type="number"
              min="1"
              value={formData.voucherExpiryHours}
              onChange={(e) => updateField('voucherExpiryHours', parseInt(e.target.value))}
            />
            <p className="text-xs text-amber-600">How long voucher is valid after redemption</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Create Voucher</Label>
              <p className="text-xs text-amber-600">Automatically create voucher on redemption</p>
            </div>
            <Switch
              checked={formData.autoCreateVoucher}
              onCheckedChange={(checked) => updateField('autoCreateVoucher', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-950">Scheduling (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
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

      {/* Targeting */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-950">Targeting (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Select 
              value={formData.targetAudience} 
              onValueChange={(value: any) => updateField('targetAudience', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="new">New Users (&lt; 7 days)</SelectItem>
                <SelectItem value="returning">Returning Users</SelectItem>
                <SelectItem value="vip">VIP Users (High Beans)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minBeans">Min Beans</Label>
              <Input
                id="minBeans"
                type="number"
                min="0"
                value={formData.minBeans || ''}
                onChange={(e) => updateField('minBeans', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No minimum"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBeans">Max Beans</Label>
              <Input
                id="maxBeans"
                type="number"
                min="0"
                value={formData.maxBeans || ''}
                onChange={(e) => updateField('maxBeans', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No maximum"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-950">Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1 = highest)</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="100"
              value={formData.priority}
              onChange={(e) => updateField('priority', parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show as Modal Popup</Label>
              <p className="text-xs text-amber-600">Display as popup when user opens app</p>
            </div>
            <Switch
              checked={formData.showAsModal}
              onCheckedChange={(checked) => updateField('showAsModal', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show as Notification</Label>
              <p className="text-xs text-amber-600">Also show in notification banner</p>
            </div>
            <Switch
              checked={formData.showAsNotification}
              onCheckedChange={(checked) => updateField('showAsNotification', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-amber-600">Offer is live and visible to users</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => updateField('active', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={creating}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          size="lg"
        >
          {creating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Create Promotional Offer
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
