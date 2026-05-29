'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  QrCode,
  Gift,
  Users,
  TrendingUp,
  Coffee,
  User,
  LogOut,
  CheckCircle,
  Award,
  Sparkles,
  BarChart3,
  X,
  MessageSquare,
  TestTube
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StaffDashboardClientProps {
  staffName: string
  stats: {
    totalCustomers: number
    activeCustomers: number
    checkInsToday: number
    stampsToday: number
    totalPoints: number
    pendingClaims: number
    activeRewards: number
  }
  topCustomers: Array<{
    id: string
    name: string
  }>
}

export function StaffDashboardClient({
  staffName,
  stats,
  topCustomers
}: StaffDashboardClientProps) {
  const [selectedStat, setSelectedStat] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Motivational messages
  const motivationalMessages = [
    "You're making customers smile today!",
    "Every stamp you give spreads joy!",
    "Your positive energy is contagious!",
    "You're the heart of Penkey!",
    "Making magic happen, one coffee at a time!",
    "Your kindness makes all the difference!",
    "Keep spreading those good vibes!",
    "You're crushing it today!",
    "Your smile brightens everyone's day!",
    "Champions work here!"
  ]

  // Get daily message (consistent per day)
  const getDailyMessage = () => {
    const today = new Date().toDateString()
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return motivationalMessages[hash % motivationalMessages.length]
  }

  const dailyMessage = getDailyMessage()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-penkey-orange" />
            <h1 className="text-2xl font-bold text-penkey-dark">Penkey Staff</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-penkey-gray hover:text-penkey-dark">
                <User className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-amber-700 hover:text-amber-900">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">

        {/* Welcome Card - Clean & Subtle */}
        <Card className="border-penkey-border bg-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Greeting */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Coffee className="w-6 h-6 text-penkey-orange" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-penkey-gray">Good {mounted ? (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening') : 'morning'},</p>
                    <h2 className="text-xl font-bold text-penkey-dark truncate">{staffName || 'Staff Member'}</h2>
                  </div>
                </div>
                
                {/* Motivational Message */}
                <div className="flex items-start gap-2 text-penkey-gray bg-orange-50/50 rounded-lg p-3">
                  <Sparkles className="w-4 h-4 text-penkey-orange flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{dailyMessage}</p>
                </div>
              </div>

              {/* Quick Info - Useful stats */}
              <div className="hidden md:flex flex-col gap-2 text-right">
                <div>
                  <p className="text-2xl font-bold text-penkey-orange">{mounted ? new Date().toLocaleDateString('en-US', { weekday: 'short' }) : 'Mon'}</p>
                  <p className="text-xs text-penkey-gray">{mounted ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jan 1'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-penkey-orange" />
            <h2 className="text-lg font-semibold text-penkey-dark">Customer Insights</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('total')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-penkey-orange" />
                  <p className="text-xs text-penkey-gray">Total</p>
                </div>
                <p className="text-2xl font-bold text-penkey-dark">{stats.totalCustomers}</p>
              </CardContent>
            </Card>

            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('active')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-penkey-gray">Active (30d)</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
              </CardContent>
            </Card>

            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('checkins')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-penkey-gray">Check-ins Today</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.checkInsToday}</p>
              </CardContent>
            </Card>

            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('stamps')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-penkey-gray">Stamps Today</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">{stats.stampsToday}</p>
              </CardContent>
            </Card>

            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('points')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-penkey-gray">Total Beans</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalPoints.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('claims')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-penkey-gray">Pending Beans</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingClaims}</p>
              </CardContent>
            </Card>

            <Card 
              className="border-penkey-border bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedStat('rewards')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-pink-600" />
                  <p className="text-xs text-penkey-gray">Active Rewards</p>
                </div>
                <p className="text-2xl font-bold text-pink-600">{stats.activeRewards}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-penkey-orange" />
            <h2 className="text-lg font-semibold text-penkey-dark">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            
            <Link href="/staff/scan">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-penkey-border bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-50 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-penkey-orange" />
                  </div>
                  <h3 className="font-bold text-sm text-penkey-dark">Scan QR</h3>
                  <p className="text-xs text-penkey-gray mt-1">Check-in & stamps</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/award-points">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-penkey-border bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-50 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-penkey-orange" />
                  </div>
                  <h3 className="font-bold text-sm text-penkey-dark">Award Beans</h3>
                  <p className="text-xs text-penkey-gray mt-1">Give bonus beans</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/messages">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-penkey-border bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-50 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-penkey-orange" />
                  </div>
                  <h3 className="font-bold text-sm text-penkey-dark">Send Message</h3>
                  <p className="text-xs text-penkey-gray mt-1">Notify customers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/customers">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-penkey-border bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-penkey-orange" />
                  </div>
                  <h3 className="font-bold text-sm text-penkey-dark">Customers</h3>
                  <p className="text-xs text-penkey-gray mt-1">View all customers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/promotional-offers">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-sm text-amber-900">Promo Offers</h3>
                  <p className="text-xs text-amber-700 mt-1">Create special offers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/test-messaging">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-purple-200 bg-purple-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                    <TestTube className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-sm text-purple-900">Test Messaging</h3>
                  <p className="text-xs text-purple-700 mt-1">Test push & emails</p>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>

      </main>

      {/* Detail Modal */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStat(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {selectedStat === 'total' && <><Users className="w-5 h-5" /> Total Customers</>}
                  {selectedStat === 'active' && <><TrendingUp className="w-5 h-5" /> Active Customers</>}
                  {selectedStat === 'checkins' && <><CheckCircle className="w-5 h-5" /> Check-ins Today</>}
                  {selectedStat === 'stamps' && <><Coffee className="w-5 h-5" /> Stamps Today</>}
                  {selectedStat === 'points' && <><Sparkles className="w-5 h-5" /> Total Beans</>}
                  {selectedStat === 'claims' && <><Gift className="w-5 h-5" /> Pending Beans</>}
                  {selectedStat === 'rewards' && <><Award className="w-5 h-5" /> Active Rewards</>}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedStat(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStat === 'total' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-penkey-orange mb-2">{stats.totalCustomers}</p>
                    <p className="text-sm text-penkey-gray">Registered Customers</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>What this means:</strong> Total number of people who have created accounts in your app.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">Insights:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>This number only goes up (unless customers are deleted)</li>
                      <li>Includes all customer accounts regardless of activity</li>
                      <li>Use with Active Customers to measure retention</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedStat === 'active' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600 mb-2">{stats.activeCustomers}</p>
                    <p className="text-sm text-penkey-gray">Active in Last 30 Days</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>Retention Rate:</strong> {stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0}%
                    </p>
                    <p className="text-xs text-penkey-gray mt-1">
                      {stats.activeCustomers} out of {stats.totalCustomers} customers checked in recently
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">What's Good:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>40-60% retention = Healthy</li>
                      <li>60%+ retention = Excellent</li>
                      <li>Below 30% = Need re-engagement</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedStat === 'checkins' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600 mb-2">{stats.checkInsToday}</p>
                    <p className="text-sm text-penkey-gray">Check-ins Since Midnight</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>Daily Foot Traffic:</strong> Shows how many customers visited your store today
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">Use This For:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>Track daily performance</li>
                      <li>Compare weekdays vs weekends</li>
                      <li>Staff scheduling decisions</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedStat === 'stamps' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-amber-600 mb-2">{stats.stampsToday}</p>
                    <p className="text-sm text-penkey-gray">Coffee Stamps Given Today</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>Conversion Rate:</strong> {stats.checkInsToday > 0 ? Math.round((stats.stampsToday / stats.checkInsToday) * 100) : 0}%
                    </p>
                    <p className="text-xs text-penkey-gray mt-1">
                      {stats.stampsToday} coffees sold out of {stats.checkInsToday} visitors
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">What's Good:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>50-80% conversion = Healthy</li>
                      <li>Each stamp = 1 coffee purchased</li>
                      <li>Use for inventory planning</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedStat === 'points' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-purple-600 mb-2">{stats.totalPoints.toLocaleString()}</p>
                    <p className="text-sm text-penkey-gray">Total Beans Awarded</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>Average per Customer:</strong> {stats.totalCustomers > 0 ? Math.round(stats.totalPoints / stats.totalCustomers) : 0} beans
                    </p>
                    <p className="text-xs text-penkey-gray mt-1">
                      Cumulative engagement since launch
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">Insights:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>This number only goes up</li>
                      <li>Includes check-ins, games, bonuses</li>
                      <li>150-300 pts/active customer = Healthy</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedStat === 'claims' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-orange-600 mb-2">{stats.pendingClaims}</p>
                    <p className="text-sm text-penkey-gray">Total Pending Beans</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>What this shows:</strong> Total number of beans across the entire app that customers have earned but haven't claimed yet
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">These beans come from:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>Game wins waiting to be claimed</li>
                      <li>Referral bonuses not yet claimed</li>
                      <li>Combo bonuses pending</li>
                      <li>Any other rewards requiring check-in</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedStat === 'rewards' && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-pink-600 mb-2">{stats.activeRewards}</p>
                    <p className="text-sm text-penkey-gray">Ready to Redeem</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <p className="text-sm text-penkey-dark">
                      <strong>What these are:</strong> Actual rewards customers can redeem right now with their QR code
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-penkey-dark">Examples:</p>
                    <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                      <li>Free coffee (10 stamps)</li>
                      <li>Beans rewards</li>
                      <li>Special promotions</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
