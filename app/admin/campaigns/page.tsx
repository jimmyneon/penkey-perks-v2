'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CampaignCard } from '@/components/campaign-card'
import { Plus, Calendar, Sparkles } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string
  type: string
  bean_multiplier: number
  start_at: string
  end_at: string
  location_required: boolean
  status: 'active' | 'upcoming' | 'ended'
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'special',
    bean_multiplier: 1,
    start_at: '',
    end_at: '',
    location_required: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('start_at', { ascending: true })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('campaigns').insert({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        bean_multiplier: formData.bean_multiplier,
        start_at: formData.start_at,
        end_at: formData.end_at,
        location_required: formData.location_required,
        status: 'upcoming',
      })

      if (error) throw error

      setShowCreateDialog(false)
      setFormData({
        name: '',
        description: '',
        type: 'special',
        bean_multiplier: 1,
        start_at: '',
        end_at: '',
        location_required: false,
      })
      loadCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const now = mounted ? new Date() : new Date(0)

  const activeCampaigns = campaigns.filter(c => {
    const start = new Date(c.start_at)
    const end = new Date(c.end_at)
    return now >= start && now <= end
  })

  const upcomingCampaigns = campaigns.filter(c => {
    const start = new Date(c.start_at)
    return now < start
  })

  const endedCampaigns = campaigns.filter(c => {
    const end = new Date(c.end_at)
    return now > end
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-gray-600">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <header className="bg-white border-b border-[#e7e5e4] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#f97316]" />
            <h1 className="text-2xl font-bold text-[#1c1917]">Campaign Management</h1>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#4a8c66] hover:bg-[#3d7356] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-[#1c1917] mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#4a8c66]" />
              Active Campaigns ({activeCampaigns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  name={campaign.name}
                  description={campaign.description}
                  type={campaign.type}
                  beanMultiplier={campaign.bean_multiplier}
                  startAt={campaign.start_at}
                  endAt={campaign.end_at}
                  locationRequired={campaign.location_required}
                  isActive={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Campaigns */}
        {upcomingCampaigns.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-[#1c1917] mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#78716c]" />
              Upcoming Campaigns ({upcomingCampaigns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  name={campaign.name}
                  description={campaign.description}
                  type={campaign.type}
                  beanMultiplier={campaign.bean_multiplier}
                  startAt={campaign.start_at}
                  endAt={campaign.end_at}
                  locationRequired={campaign.location_required}
                  isActive={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ended Campaigns */}
        {endedCampaigns.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-[#1c1917] mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#78716c]" />
              Ended Campaigns ({endedCampaigns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  name={campaign.name}
                  description={campaign.description}
                  type={campaign.type}
                  beanMultiplier={campaign.bean_multiplier}
                  startAt={campaign.start_at}
                  endAt={campaign.end_at}
                  locationRequired={campaign.location_required}
                  isActive={false}
                />
              ))}
            </div>
          </section>
        )}

        {campaigns.length === 0 && (
          <Card className="border-[#e7e5e4]">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-[#78716c]" />
              <p className="text-[#78716c] mb-4">No campaigns yet</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#4a8c66] hover:bg-[#3d7356] text-white"
              >
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a8c66]"
                placeholder="e.g., Rainy Day Double Beans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a8c66]"
                rows={3}
                placeholder="Describe the campaign..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a8c66]"
              >
                <option value="special">Special Event</option>
                <option value="seasonal">Seasonal</option>
                <option value="wheel">Lucky Duck Wheel</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-1">
                Bean Multiplier
              </label>
              <input
                type="number"
                value={formData.bean_multiplier}
                onChange={(e) => setFormData({ ...formData, bean_multiplier: parseInt(e.target.value) })}
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a8c66]"
              />
              <p className="text-xs text-[#78716c] mt-1">1x = normal, 2x = double beans</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a8c66]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a8c66]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="location_required"
                checked={formData.location_required}
                onChange={(e) => setFormData({ ...formData, location_required: e.target.checked })}
                className="w-4 h-4 text-[#4a8c66] border-[#e7e5e4] rounded focus:ring-[#4a8c66]"
              />
              <label htmlFor="location_required" className="text-sm text-[#1c1917]">
                Require in-store location verification
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                className="flex-1 bg-[#4a8c66] hover:bg-[#3d7356] text-white"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
