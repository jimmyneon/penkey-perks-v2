'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Minus, Eye, Trophy, Medal, Share2, Download, Filter, TrendingUp, Gift, Gamepad2, Users, Calendar, Award, ArrowLeft, Coffee } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CustomerStats {
  beans: number
  currentBalance: number
  rewardsEarned: number
  rewardsRedeemed: number
  rewardsActive: number
  gamePlays: number
  totalReferrals: number
  confirmedReferrals: number
  lastCheckIn: string | null
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
  stats: CustomerStats
}

interface CustomersLeaderboardProps {
  customers: Customer[]
}

type SortOption = 'beans' | 'rewards' | 'games' | 'referrals'

export function CustomersLeaderboard({ customers: initialCustomers }: CustomersLeaderboardProps) {
  const [customers] = useState(initialCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [duckAmount, setDuckAmount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('beans')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sort and filter customers
  const sortedAndFilteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort by selected metric
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'beans':
          return b.stats.beans - a.stats.beans
        case 'rewards':
          return b.stats.rewardsEarned - a.stats.rewardsEarned
        case 'games':
          return b.stats.gamePlays - a.stats.gamePlays
        case 'referrals':
          return b.stats.confirmedReferrals - a.stats.confirmedReferrals
        default:
          return 0
      }
    })

    return filtered
  }, [customers, searchQuery, sortBy])

  // Get top 3 for podium
  const topThree = sortedAndFilteredCustomers.slice(0, 3)

  // Show loading state if no customers loaded yet
  if (customers.length === 0 && !searchQuery) {
    return (
      <div className="min-h-screen bg-penkey-cream flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500 animate-pulse" />
          <p className="text-lg font-semibold text-penkey-dark">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const handleAddDucks = async () => {
    if (!selectedCustomer || duckAmount < 1) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ducks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          amount: duckAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add ducks')
      }

      toast({
        title: 'Success!',
        description: `Added ${duckAmount} duck${duckAmount > 1 ? 's' : ''} to ${selectedCustomer.name}`,
      })

      router.refresh()
      setSelectedCustomer(null)
      setDuckAmount(1)
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

  const handleRemoveDucks = async () => {
    if (!selectedCustomer || duckAmount < 1) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ducks/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          amount: duckAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove ducks')
      }

      toast({
        title: 'Success',
        description: `Removed ${duckAmount} duck${duckAmount > 1 ? 's' : ''} from ${selectedCustomer.name}`,
      })

      router.refresh()
      setSelectedCustomer(null)
      setDuckAmount(1)
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

  const handleShare = async () => {
    const shareText = `🏆 Penkey Perks Leaderboard 🏆\n\n${topThree.map((customer, idx) =>
      `${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} ${customer.name} - ${customer.stats.beans} beans`
    ).join('\n')}\n\nJoin us at Penkey Coffee!`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Penkey Perks Leaderboard',
          text: shareText,
        })
        toast({
          title: 'Shared!',
          description: 'Leaderboard shared successfully',
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      toast({
        title: 'Copied!',
        description: 'Leaderboard copied to clipboard',
      })
    }
    setShowShareDialog(false)
  }

  const handleDownloadCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Lifetime Beans', 'Rewards Earned', 'Rewards Redeemed', 'Game Plays', 'Referrals', 'Joined Date']
    const rows = sortedAndFilteredCustomers.map((customer, idx) => [
      idx + 1,
      customer.name,
      customer.email,
      customer.stats.beans,
      customer.stats.rewardsEarned,
      customer.stats.rewardsRedeemed,
      customer.stats.gamePlays,
      customer.stats.confirmedReferrals,
      new Date(customer.created_at).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `penkey-leaderboard-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded!',
      description: 'Leaderboard exported as CSV',
    })
  }

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'beans': return 'Lifetime Beans'
      case 'rewards': return 'Rewards'
      case 'games': return 'Game Plays'
      case 'referrals': return 'Referrals'
    }
  }

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'text-yellow-500'
      case 1: return 'text-gray-400'
      case 2: return 'text-amber-600'
      default: return 'text-gray-400'
    }
  }

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 0: return 'h-48'
      case 1: return 'h-36'
      case 2: return 'h-28'
      default: return 'h-24'
    }
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <Link href="/staff/dashboard">
              <Button variant="ghost" size="sm" className="text-penkey-gray hover:text-penkey-dark">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-penkey-dark">Customer Leaderboard</h1>
                <p className="text-sm text-penkey-gray">Top performers and stats</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
              <Share2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">

      {/* Search and Filter */}
      <Card className="bg-white border-penkey-border">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-penkey-gray w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-penkey-border"
              />
            </div>
            <div className="w-48">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="border-penkey-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beans">Sort by Beans</SelectItem>
                  <SelectItem value="rewards">Sort by Rewards</SelectItem>
                  <SelectItem value="games">Sort by Games</SelectItem>
                  <SelectItem value="referrals">Sort by Referrals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Podium - Top 3 */}
      {topThree.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-penkey-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Ranked by {getSortLabel(sortBy)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 pb-8">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center flex-1 max-w-xs">
                  <Medal className={`w-12 h-12 mb-2 ${getMedalColor(1)}`} />
                  <div className="text-center mb-3">
                    <p className="font-bold text-lg">{topThree[1].name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{topThree[1].email}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Badge variant="secondary" className="text-lg font-bold">
                        {topThree[1].stats.beans} 🫘
                      </Badge>
                    </div>
                  </div>
                  <div className={`w-full ${getPodiumHeight(1)} bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-white">2</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center flex-1 max-w-xs">
                  <Trophy className={`w-16 h-16 mb-2 ${getMedalColor(0)} animate-pulse`} />
                  <div className="text-center mb-3">
                    <p className="font-bold text-xl">{topThree[0].name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{topThree[0].email}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Badge className="text-xl font-bold bg-yellow-500 hover:bg-yellow-600">
                        {topThree[0].stats.beans} 🫘
                      </Badge>
                    </div>
                  </div>
                  <div className={`w-full ${getPodiumHeight(0)} bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg flex items-center justify-center shadow-lg`}>
                    <span className="text-5xl font-bold text-white">1</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center flex-1 max-w-xs">
                  <Medal className={`w-12 h-12 mb-2 ${getMedalColor(2)}`} />
                  <div className="text-center mb-3">
                    <p className="font-bold text-lg">{topThree[2].name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{topThree[2].email}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Badge variant="secondary" className="text-lg font-bold">
                        {topThree[2].stats.beans} 🫘
                      </Badge>
                    </div>
                  </div>
                  <div className={`w-full ${getPodiumHeight(2)} bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-lg flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-white">3</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Customers List */}
      <Card className="bg-white border-penkey-border">
        <CardHeader>
          <CardTitle className="text-penkey-dark">All Customers ({sortedAndFilteredCustomers.length})</CardTitle>
          <CardDescription className="text-penkey-gray">Complete leaderboard rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedAndFilteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center gap-4 p-4 bg-white border border-penkey-border rounded-lg hover:bg-penkey-cream transition-colors cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-penkey-cream font-bold text-lg shrink-0 text-penkey-dark">
                  {index < 3 ? (
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate">{customer.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex gap-6 items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-penkey-orange">{customer.stats.beans}</p>
                    <p className="text-xs text-muted-foreground">Beans</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-green-600">{customer.stats.rewardsEarned}</p>
                    <p className="text-xs text-muted-foreground">Rewards</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-blue-600">{customer.stats.gamePlays}</p>
                    <p className="text-xs text-muted-foreground">Games</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-purple-600">{customer.stats.confirmedReferrals}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                </div>

                {/* Action Button */}
                <Button size="sm" variant="outline" className="shrink-0">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>
            ))}

            {sortedAndFilteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-penkey-gray opacity-50" />
                <p className="text-lg font-semibold text-penkey-dark mb-2">No customers found</p>
                <p className="text-sm text-penkey-gray">
                  {searchQuery ? 'Try adjusting your search terms' : 'No customers in the system yet'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Leaderboard</DialogTitle>
            <DialogDescription>Share the top performers on social media</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-mono text-sm whitespace-pre-wrap">
                🏆 Penkey Perks Leaderboard 🏆{'\n\n'}
                {topThree.map((customer, idx) => 
                  `${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} ${customer.name} - ${customer.stats.beans} beans`
                ).join('\n')}
                {'\n\n'}Join us at Penkey Coffee!
              </p>
            </div>
            <Button onClick={handleShare} className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedCustomer?.name}</DialogTitle>
            <DialogDescription>{selectedCustomer?.email}</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-penkey-orange" />
                    <p className="text-3xl font-bold text-penkey-orange">{selectedCustomer.stats.beans}</p>
                    <p className="text-sm text-muted-foreground">Lifetime Beans</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-3xl font-bold text-amber-600">{selectedCustomer.stats.currentBalance}</p>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Gift className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-3xl font-bold text-green-600">{selectedCustomer.stats.rewardsEarned}</p>
                    <p className="text-sm text-muted-foreground">Rewards Earned</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-3xl font-bold text-blue-600">{selectedCustomer.stats.gamePlays}</p>
                    <p className="text-sm text-muted-foreground">Games Played</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-3xl font-bold text-purple-600">{selectedCustomer.stats.confirmedReferrals}</p>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Active Rewards
                    </span>
                    <Badge variant="secondary">{selectedCustomer.stats.rewardsActive}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Redeemed Rewards
                    </span>
                    <Badge variant="secondary">{selectedCustomer.stats.rewardsRedeemed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total Referrals
                    </span>
                    <Badge variant="secondary">{selectedCustomer.stats.totalReferrals}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last Check-in
                    </span>
                    <span className="font-medium">
                      {selectedCustomer.stats.lastCheckIn 
                        ? new Date(selectedCustomer.stats.lastCheckIn).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </span>
                    <span className="font-medium">
                      {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedCustomer.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manage Ducks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manage Ducks</CardTitle>
                  <CardDescription>Add or remove ducks for this customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="duckAmount">Number of Ducks</Label>
                    <Input
                      id="duckAmount"
                      type="number"
                      min="1"
                      value={duckAmount}
                      onChange={(e) => setDuckAmount(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleAddDucks}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ducks
                    </Button>

                    <Button
                      onClick={handleRemoveDucks}
                      disabled={isLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
