'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Search, CheckCircle, Gift, Coffee, User, Sparkles, Award, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface AwardType {
  id: string
  award_type: string
  name: string
  icon: string
  points: number
  limit_type: string
  limit_count: number | null
  description: string
}

interface AwardPointsClientProps {
  staffId: string
  awardTypes: AwardType[]
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  current_points: number
  lifetime_points: number
  stamps_count: number
}

// Map award types to Lucide icons
const getAwardIcon = (awardType: string) => {
  switch (awardType) {
    case 'social_media_share': return Sparkles
    case 'referral_bonus': return User
    case 'birthday_bonus': return Gift
    case 'event_participation': return Award
    case 'survey_completion': return CheckCircle
    case 'complaint_resolution': return Coffee
    case 'custom_amount': return TrendingUp
    default: return Gift
  }
}

export function AwardPointsClient({ staffId, awardTypes }: AwardPointsClientProps) {
  console.log('AwardPointsClient loaded with:', { staffId, awardTypesCount: awardTypes.length, awardTypes })
  
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [selectedAward, setSelectedAward] = useState<AwardType | null>(null)
  const [customPoints, setCustomPoints] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [awarding, setAwarding] = useState(false)
  const { toast } = useToast()

  // Pre-fill customer from QR scanner
  useEffect(() => {
    const customerId = searchParams.get('customerId')
    const customerName = searchParams.get('name')
    
    if (customerId && customerName) {
      // Auto-search for this customer
      setSearchQuery(customerName)
      loadCustomerById(customerId)
    }
  }, [searchParams])

  const loadCustomerById = async (customerId: string) => {
    console.log('loadCustomerById called with:', customerId)
    setLoading(true)
    try {
      const requestBody = { customerId }
      console.log('Sending POST request with body:', requestBody)
      
      const response = await fetch('/api/staff/get-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load customer')
      }

      setCustomer(data.customer)
      console.log('Customer set successfully:', data.customer)
    } catch (error: any) {
      console.error('Error in loadCustomerById:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load customer',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const searchCustomer = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name, email, or phone number',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/staff/get-customer?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find customer')
      }

      if (!data.customer) {
        toast({
          title: 'Not Found',
          description: 'No customer found with that information',
          variant: 'destructive'
        })
        return
      }

      setCustomer(data.customer)
      toast({
        title: 'Customer Found!',
        description: `${data.customer.first_name} ${data.customer.last_name}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAwardPoints = async () => {
    if (!customer || !selectedAward) return

    const points = selectedAward.award_type === 'custom_amount' 
      ? parseInt(customPoints) 
      : selectedAward.points

    if (!points || points <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid beans amount',
        variant: 'destructive'
      })
      return
    }

    setAwarding(true)
    try {
      // Award points (photo upload feature coming soon)
      const response = await fetch('/api/staff/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customer.id,
          staffId,
          awardType: selectedAward.award_type,
          points,
          reason: reason || selectedAward.description,
          notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to award points')
      }

      toast({
        title: 'Success!',
        description: `${customer.first_name} received ${points} beans!`,
      })

      // Reset form
      setSelectedAward(null)
      setCustomPoints('')
      setReason('')
      setNotes('')
      setCustomer(null)
      setSearchQuery('')

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setAwarding(false)
    }
  }

  const getLimitText = (award: AwardType) => {
    if (award.limit_type === 'unlimited') return 'No limit'
    if (!award.limit_count) return 'No limit'
    return `${award.limit_count}/${award.limit_type.replace('per_', '')}`
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2">
            <Gift className="w-8 h-8 text-penkey-orange" />
            <h1 className="text-2xl font-bold text-penkey-dark">Award Points</h1>
          </div>
          <Link href="/staff/dashboard">
            <Button variant="ghost" className="text-penkey-gray hover:text-penkey-dark">
              Back
            </Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">

        {/* Search Customer */}
        <Card className="border-penkey-border bg-white">
          <CardHeader>
            <CardTitle>Find Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
                className="flex-1"
              />
              <Button onClick={searchCustomer} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info - Mobile Optimized */}
        {customer && (
          <Card className="border-penkey-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-penkey-dark">
                <CheckCircle className="w-5 h-5 text-penkey-orange flex-shrink-0" />
                Customer Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-base md:text-lg font-bold text-gray-900 truncate">
                  {customer.first_name} {customer.last_name}
                </p>
                <p className="text-xs md:text-sm text-gray-600 truncate">{customer.email}</p>
                <p className="text-xs md:text-sm text-gray-600">{customer.phone}</p>
                
                {/* Stats Grid - Mobile: 3 columns, Better spacing */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-amber-700">{customer.current_points}</p>
                    <p className="text-xs text-gray-500 mt-1">Points</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Coffee className="w-4 h-4 text-orange-700" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-orange-700">{customer.stamps_count}/10</p>
                    <p className="text-xs text-gray-500 mt-1">Stamps</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-amber-600">{customer.lifetime_points}</p>
                    <p className="text-xs text-gray-500 mt-1">Lifetime</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Award Type Selection - Mobile Optimized */}
        {customer && !selectedAward && (
          <Card className="border-penkey-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Gift className="w-5 h-5 text-penkey-orange" />
                Select Award Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {awardTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No award types available</p>
                  <p className="text-sm text-gray-400">
                    Contact your administrator to set up award types
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {awardTypes.map((award) => {
                    const IconComponent = getAwardIcon(award.award_type)
                    return (
                    <Card 
                      key={award.id}
                      className="hover:border-amber-300 transition-colors cursor-pointer hover:shadow-md active:scale-98"
                      onClick={() => setSelectedAward(award)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-5 h-5 text-penkey-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base text-gray-900 truncate">{award.name}</h4>
                            <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{award.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg md:text-xl font-bold text-amber-700 whitespace-nowrap">
                              {award.award_type === 'custom_amount' ? '?' : award.points} pts
                            </div>
                            <div className="text-xs text-gray-500 hidden md:block">{getLimitText(award)}</div>
                          </div>
                        </div>
                        {/* Show limit on mobile below */}
                        <div className="text-xs text-gray-500 mt-2 md:hidden">{getLimitText(award)}</div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Award Details Form - Mobile Optimized */}
        {customer && selectedAward && (
          <Card className="border-penkey-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <div className="flex items-center gap-2 truncate mr-2">
                  {(() => {
                    const IconComponent = getAwardIcon(selectedAward.award_type)
                    return <IconComponent className="w-5 h-5 text-penkey-orange flex-shrink-0" />
                  })()}
                  <span className="truncate">{selectedAward.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAward(null)} className="flex-shrink-0">
                  Change
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {selectedAward.award_type === 'custom_amount' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Points Amount *</label>
                  <Input
                    type="number"
                    placeholder="Enter points (max 500)"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value)}
                    max={500}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
                <Input
                  placeholder={selectedAward.description}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <Textarea
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleAwardPoints} 
                disabled={awarding}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                {awarding ? 'Awarding...' : `Award ${selectedAward.award_type === 'custom_amount' ? customPoints || '?' : selectedAward.points} Points`}
              </Button>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}
