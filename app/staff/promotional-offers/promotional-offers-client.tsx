'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Gift, Plus, Eye, Trash2, ToggleLeft, ToggleRight, TrendingUp, Target, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PromotionalOfferForm } from '@/components/staff/promotional-offer-form'
import { createClient } from '@/lib/supabase/client'

interface PromotionalOffersClientProps {
  staffId: string
  staffName: string
}

interface PromotionalOffer {
  id: string
  title: string
  description: string
  reward_type: string
  reward_value: string
  icon: string
  active: boolean
  redemptions_count: number
  total_redemption_limit: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export function PromotionalOffersClient({ staffId, staffName }: PromotionalOffersClientProps) {
  const [offers, setOffers] = useState<PromotionalOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/staff/promotional-offers/list')
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }

      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load offers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [])

  // Realtime subscription for promotional offers
  useEffect(() => {
    console.log('[Staff Promo Offers] Setting up realtime subscription')

    const channel = supabase
      .channel('staff-promotional-offers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotional_offers',
        },
        (payload) => {
          console.log('[Staff Promo Offers] Realtime update:', payload)
          // Refetch offers when any offer changes
          fetchOffers()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_promotional_offers',
        },
        (payload) => {
          console.log('[Staff Promo Offers] User interaction update:', payload)
          // Refetch to update redemption counts
          fetchOffers()
        }
      )
      .subscribe()

    return () => {
      console.log('[Staff Promo Offers] Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleToggleActive = async (offerId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/staff/promotional-offers/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: offerId, active: !currentActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update offer')
      }

      toast({
        title: 'Success',
        description: `Offer ${!currentActive ? 'activated' : 'deactivated'}`,
      })

      fetchOffers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update offer',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) {
      return
    }

    try {
      const response = await fetch(`/api/staff/promotional-offers/delete?id=${offerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete offer')
      }

      toast({
        title: 'Success',
        description: 'Offer deleted successfully',
      })

      fetchOffers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete offer',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No limit'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <Gift className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-penkey-dark">Promotional Offers</h1>
          </div>
          <Link href="/staff/dashboard">
            <Button variant="ghost" size="icon" className="text-penkey-gray hover:text-penkey-dark">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700">Total Offers</p>
                  <p className="text-3xl font-bold text-amber-900">{offers.length}</p>
                </div>
                <Gift className="w-10 h-10 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Active Offers</p>
                  <p className="text-3xl font-bold text-green-900">
                    {offers.filter(o => o.active).length}
                  </p>
                </div>
                <ToggleRight className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Redemptions</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {offers.reduce((sum, o) => sum + o.redemptions_count, 0)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Offer Button */}
        {!showForm && (
          <Card className="border-amber-200">
            <CardContent className="p-6">
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Promotional Offer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className="border-amber-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-amber-950">Create New Offer</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PromotionalOfferForm
                onSuccess={() => {
                  setShowForm(false)
                  fetchOffers()
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Existing Offers */}
        <Card className="border-amber-200">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="text-amber-950">Existing Offers</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8 text-amber-600">Loading offers...</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8 text-amber-600">
                No promotional offers yet. Create your first one above!
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map(offer => (
                  <Card key={offer.id} className={`border-2 ${offer.active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-3xl">{offer.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-gray-900">{offer.title}</h3>
                              {offer.active ? (
                                <Badge className="bg-green-600 text-white">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-400 text-gray-600">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{offer.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> {offer.reward_value}</span>
                              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {offer.redemptions_count} redemptions</span>
                              {offer.total_redemption_limit && (
                                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Limit: {offer.total_redemption_limit}</span>
                              )}
                              {offer.end_date && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ends: {formatDate(offer.end_date)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(offer.id, offer.active)}
                            className={offer.active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
                          >
                            {offer.active ? (
                              <>
                                <ToggleLeft className="w-4 h-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(offer.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
