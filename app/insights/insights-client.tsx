'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  TrendingUp, 
  Coffee, 
  Calendar, 
  Clock, 
  MapPin,
  Award,
  Receipt,
  ChevronRight,
  Star,
  BarChart3,
  Heart,
  ShoppingBag,
  Sparkles,
  Gift
} from 'lucide-react'
import Link from 'next/link'

interface InsightsClientProps {
  user: {
    id: string
    name: string
    email: string
  }
  analyticsData: any
}

export function InsightsClient({ user, analyticsData }: InsightsClientProps) {
  const router = useRouter()
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null)

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-penkey-dark">My Insights</h1>
              <p className="text-sm text-penkey-gray">Your purchase history & favorites</p>
            </div>
          </div>

          {/* No Data State */}
          <Card className="border-2 border-dashed border-penkey-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="w-16 h-16 text-penkey-gray/30 mb-4" />
              <h3 className="text-lg font-semibold text-penkey-dark mb-2">No Purchase History Yet</h3>
              <p className="text-sm text-penkey-gray max-w-md">
                Make your first purchase at Penkey to see your personalized insights and favorite items!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { summary, top_items, recent_purchases, monthly_spending, milestones } = analyticsData

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Format time
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-penkey-dark">My Rewards & Savings</h1>
            <p className="text-sm text-green-600 font-semibold">See how much you've saved!</p>
          </div>
        </div>

        {/* Summary Stats Grid - Focus on SAVINGS & BENEFITS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-green-700">{formatCurrency(summary.total_savings)}</p>
              <p className="text-xs text-green-600 font-semibold">Total Saved!</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4 text-center">
              <Coffee className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-amber-700">{summary.estimated_free_coffees}</p>
              <p className="text-xs text-amber-600 font-semibold">Free Coffees</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-purple-700">{summary.total_points_earned}</p>
              <p className="text-xs text-purple-600 font-semibold">Points Earned</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-penkey-orange/30 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-penkey-orange mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-penkey-dark">{summary.total_visits}</p>
              <p className="text-xs text-penkey-gray">Visits</p>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Favorite Items */}
        <Card className="border-2 border-penkey-orange/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-penkey-dark">
              <Heart className="w-5 h-5 text-red-500" />
              Your Top 5 Favorites
            </CardTitle>
            <CardDescription>Items you order most often</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {top_items.length === 0 ? (
              <p className="text-sm text-penkey-gray text-center py-4">No favorite items yet</p>
            ) : (
              top_items.map((item: any, index: number) => (
                <motion.div
                  key={item.item_id || item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-penkey-border"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-penkey-orange text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-penkey-dark truncate">{item.name}</p>
                    <p className="text-xs text-penkey-gray">
                      Ordered {item.times_ordered} time{item.times_ordered !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Your Habits */}
        <Card className="border-2 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-penkey-dark">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Your Habits
            </CardTitle>
            <CardDescription>When and how you visit us</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-penkey-gray">Most Active Time</p>
                  <p className="font-bold text-penkey-dark">{formatTime(summary.most_active_hour)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-penkey-gray">Favorite Day</p>
                  <p className="font-bold text-penkey-dark">{summary.most_active_day}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <MapPin className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-penkey-gray">Dining Preference</p>
                  <p className="font-bold text-penkey-dark capitalize">{summary.favorite_dining_option.replace('-', ' ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Star className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-penkey-gray">Member Since</p>
                  <p className="font-bold text-penkey-dark">{formatDate(summary.first_purchase_date)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        {milestones && (
          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-penkey-dark">
                <Award className="w-5 h-5 text-amber-600" />
                Loyalty Milestones
              </CardTitle>
              <CardDescription>Your journey with us</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress to next milestone */}
              <div className="p-4 bg-white rounded-lg border-2 border-amber-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-penkey-dark">Next: {milestones.next.label}</span>
                  <span className="text-sm font-bold text-amber-600">
                    {summary.total_visits}/{milestones.next.visits} visits
                  </span>
                </div>
                <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(milestones.progress * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-penkey-gray mt-2">
                  {milestones.next.visits - summary.total_visits} more visit{milestones.next.visits - summary.total_visits !== 1 ? 's' : ''} to unlock!
                </p>
              </div>

              {/* Achieved milestones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {milestones.achieved.map((milestone: any) => (
                  <div
                    key={milestone.visits}
                    className="p-3 bg-white rounded-lg border border-amber-200 text-center"
                  >
                    <Award className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-penkey-dark">{milestone.label}</p>
                    <p className="text-xs text-penkey-gray">{milestone.visits} visits</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Purchases */}
        <Card className="border-2 border-penkey-orange/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-penkey-dark">
              <Receipt className="w-5 h-5 text-penkey-orange" />
              Recent Purchases
            </CardTitle>
            <CardDescription>Your last 10 orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent_purchases.length === 0 ? (
              <p className="text-sm text-penkey-gray text-center py-4">No recent purchases</p>
            ) : (
              recent_purchases.map((purchase: any) => (
                <div
                  key={purchase.receipt_id}
                  className="border border-penkey-border rounded-lg overflow-hidden bg-white"
                >
                  <button
                    onClick={() => setExpandedReceipt(
                      expandedReceipt === purchase.receipt_id ? null : purchase.receipt_id
                    )}
                    className="w-full p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-penkey-dark">{purchase.receipt_number}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-penkey-orange/10 text-penkey-orange capitalize">
                          {purchase.dining_option.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-penkey-gray">{formatDate(purchase.date)}</p>
                      <p className="text-xs text-penkey-gray">{purchase.items_count} item{purchase.items_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-penkey-dark">{formatCurrency(purchase.total)}</p>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-penkey-gray transition-transform ${
                        expandedReceipt === purchase.receipt_id ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>

                  {/* Expanded receipt details */}
                  {expandedReceipt === purchase.receipt_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-penkey-border bg-orange-50/50 p-4 space-y-2"
                    >
                      {purchase.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <p className="text-penkey-dark">
                              {item.quantity}x {item.name}
                            </p>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-xs text-penkey-gray ml-4">
                                + {item.modifiers.map((m: any) => m.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold text-penkey-dark">{formatCurrency(item.line_total)}</p>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-penkey-border space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-penkey-gray">Subtotal</span>
                          <span className="text-penkey-dark">{formatCurrency(purchase.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-penkey-gray">Tax</span>
                          <span className="text-penkey-dark">{formatCurrency(purchase.tax_total)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-penkey-dark">
                          <span>Total</span>
                          <span>{formatCurrency(purchase.total)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Savings Breakdown */}
        <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Sparkles className="w-5 h-5 text-green-600" />
              Your Savings Breakdown
            </CardTitle>
            <CardDescription className="text-green-600">How you've benefited from being a member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Savings Hero */}
            <div className="p-6 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl text-white text-center">
              <p className="text-sm font-semibold mb-2 opacity-90">Total Value Received</p>
              <p className="text-4xl sm:text-5xl font-bold mb-1">{formatCurrency(summary.total_savings)}</p>
              <p className="text-sm opacity-90">in rewards and discounts!</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {summary.free_coffee_savings > 0 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-penkey-dark">Free Coffees</p>
                      <p className="text-xs text-penkey-gray">{summary.estimated_free_coffees} free drinks earned</p>
                    </div>
                  </div>
                  <p className="font-bold text-amber-600">{formatCurrency(summary.free_coffee_savings)}</p>
                </div>
              )}

              {summary.discount_savings > 0 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-penkey-dark">Discounts Applied</p>
                      <p className="text-xs text-penkey-gray">Special offers & promotions</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(summary.discount_savings)}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-penkey-dark">Points Earned</p>
                    <p className="text-xs text-penkey-gray">Ready to redeem for rewards</p>
                  </div>
                </div>
                <p className="font-bold text-purple-600">{summary.total_points_earned} pts</p>
              </div>
            </div>

            {/* Encouragement Message */}
            <div className="p-4 bg-white rounded-lg border-2 border-green-300 text-center">
              <p className="text-sm text-penkey-dark">
                <strong className="text-green-600">Keep it up!</strong> Every visit earns you more rewards and savings!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard Button */}
        <div className="pt-4">
          <Link href="/dashboard">
            <Button className="w-full" variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
