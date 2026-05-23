import { Coffee, Gift, Users, Sparkles, MapPin, Heart, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function DesignDemoPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header - Warmer, More Personal */}
      <header className="bg-gradient-to-r from-[#8B6F47] to-[#A0826D] border-b-4 border-[#C9A961] sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F5F1E8] rounded-full flex items-center justify-center">
              <Coffee className="w-6 h-6 text-[#8B6F47]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F1E8]">Penkey Perks</h1>
              <p className="text-xs text-[#F5F1E8]/80">From John & Amanda</p>
            </div>
          </div>
          <Heart className="w-6 h-6 text-[#F5F1E8]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-2xl">
        
        {/* Design Comparison Banner */}
        <Card className="border-4 border-[#C9A961] bg-gradient-to-br from-[#F5F1E8] to-white shadow-xl">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-[#C9A961] mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-[#3E3028] mb-2">
              Design Vision Demo
            </h2>
            <p className="text-sm text-[#6B5D52]">
              This page shows the proposed design improvements with warmer colors, 
              better typography, and more personal touches.
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <Link href="/dashboard">
                <Button variant="outline" className="border-[#8B6F47] text-[#8B6F47]">
                  View Current Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Personal Welcome Message - NEW STYLE */}
        <Card className="border-l-4 border-[#9CAF88] bg-gradient-to-br from-[#F5F1E8] to-white shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8B6F47] to-[#A0826D] flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl">👋</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#3E3028] mb-1">
                  Morning, love! ☕
                </h3>
                <p className="text-sm text-[#6B5D52] leading-relaxed">
                  Amanda here - we've just pulled fresh sausage rolls out of the oven! 
                  Still warm and absolutely delicious. Pop in before they're gone! 🥐
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[#8B6F47]">
                  <MapPin className="w-3 h-3" />
                  <span>Posted 15 minutes ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card - Enhanced */}
        <Card className="border-2 border-[#C9A961]/30 bg-gradient-to-br from-white via-[#F5F1E8]/30 to-white shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8B6F47] to-[#C9A961] flex items-center justify-center text-3xl shadow-lg">
                  😊
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#9CAF88] rounded-full flex items-center justify-center border-2 border-white shadow">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#3E3028]">Sarah Thompson</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-[#9CAF88] text-white border-0 shadow-sm">
                    Coffee Connoisseur
                  </Badge>
                  <span className="text-xs text-[#6B5D52]">Member since Jan 2024</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-[#F5F1E8] rounded-lg">
                <p className="text-2xl font-bold text-[#8B6F47]">127</p>
                <p className="text-xs text-[#6B5D52] mt-1">Beans</p>
              </div>
              <div className="text-center p-3 bg-[#F5F1E8] rounded-lg">
                <p className="text-2xl font-bold text-[#8B6F47]">8</p>
                <p className="text-xs text-[#6B5D52] mt-1">Stamps</p>
              </div>
              <div className="text-center p-3 bg-[#F5F1E8] rounded-lg">
                <p className="text-2xl font-bold text-[#8B6F47]">42</p>
                <p className="text-xs text-[#6B5D52] mt-1">Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Special - NEW FEATURE */}
        <Card className="border-3 border-[#C9A961] bg-gradient-to-br from-[#FFF9E6] via-white to-[#F5F1E8] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A961]/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#9CAF88]/10 rounded-full -ml-12 -mb-12" />
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#3E3028]">
                <Sparkles className="w-5 h-5 text-[#C9A961]" />
                Fresh Today!
              </CardTitle>
              <Badge className="bg-gradient-to-r from-[#C9A961] to-[#D4B76A] text-white border-0 shadow-lg animate-pulse">
                Limited Time
              </Badge>
            </div>
            <CardDescription className="text-[#6B5D52]">
              Made with love this morning
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-[#C9A961]/30 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-[#3E3028]">Spinach & Feta Quiche</h3>
                    <p className="text-sm text-[#6B5D52] mt-1">
                      Fresh from the oven! Made with local New Forest spinach and 
                      Isle of Wight feta. Only 4 slices left!
                    </p>
                  </div>
                  <span className="text-3xl">🥧</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-semibold text-[#8B6F47]">£4.50</span>
                  <Badge className="bg-[#9CAF88] text-white">20% OFF with app</Badge>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border-2 border-[#C9A961]/30 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-[#3E3028]">Victoria Sponge</h3>
                    <p className="text-sm text-[#6B5D52] mt-1">
                      Amanda's famous recipe! Light, fluffy, and filled with 
                      homemade raspberry jam. Last 2 slices!
                    </p>
                  </div>
                  <span className="text-3xl">🍰</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-semibold text-[#8B6F47]">£3.80</span>
                  <span className="text-xs text-red-600 font-semibold">Almost gone!</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-[#6B5D52] mt-4 italic">
              Available until 4pm or while stocks last
            </p>
          </CardContent>
        </Card>

        {/* Coffee Stamp Card - Enhanced Design */}
        <Card className="border-3 border-[#8B6F47] bg-gradient-to-br from-[#F5F1E8] via-white to-[#FFF9E6] shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#3E3028]">
              <div className="p-2 bg-gradient-to-br from-[#8B6F47] to-[#A0826D] rounded-lg shadow-md">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              Coffee Stamp Card
            </CardTitle>
            <CardDescription className="text-[#6B5D52]">
              Collect 10 stamps for a free coffee from Coffee Mongers ☕
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Stamp Grid */}
              <div className="relative">
                <div className="grid grid-cols-5 gap-3 p-5 bg-white rounded-xl border-3 border-[#8B6F47]/30 shadow-inner">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
                        i < 8
                          ? 'bg-gradient-to-br from-[#8B6F47] via-[#A0826D] to-[#8B6F47] border-[#6B5537] shadow-lg transform scale-110'
                          : 'bg-gradient-to-br from-gray-50 to-white border-[#8B6F47]/30 border-dashed opacity-60'
                      }`}
                    >
                      {i < 8 ? (
                        <Coffee className="w-5 h-5 text-white drop-shadow" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-[#8B6F47]/20" />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Decorative corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#C9A961] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#C9A961] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#C9A961] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#C9A961] rounded-br-lg" />
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6B5D52] font-medium">Your Progress</span>
                  <span className="font-bold text-[#8B6F47] bg-[#F5F1E8] px-3 py-1 rounded-full text-xs shadow-sm">
                    8/10 stamps
                  </span>
                </div>
                <div className="h-3 bg-gradient-to-r from-[#F5F1E8] to-[#FFF9E6] rounded-full overflow-hidden shadow-inner border border-[#8B6F47]/20">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B6F47] via-[#A0826D] to-[#C9A961] transition-all duration-500 shadow-sm"
                    style={{ width: '80%' }}
                  />
                </div>
                <p className="text-xs text-center text-[#6B5D52] italic">
                  Just 2 more visits for your free coffee! 🎉
                </p>
              </div>

              {/* Coffee Info */}
              <div className="p-4 bg-gradient-to-br from-[#F5F1E8] to-white rounded-lg border-2 border-[#8B6F47]/20">
                <h4 className="font-semibold text-[#3E3028] mb-2 flex items-center gap-2">
                  <span className="text-lg">☕</span>
                  Why Our Coffee is Special
                </h4>
                <ul className="text-sm text-[#6B5D52] space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C9A961] font-bold">•</span>
                    <span>Roasted locally by Coffee Mongers in Lymington</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C9A961] font-bold">•</span>
                    <span>Ground fresh to order (even our decaf!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C9A961] font-bold">•</span>
                    <span>John personally selects each blend</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather-Based Offer - NEW FEATURE */}
        <Card className="border-2 border-[#9CAF88] bg-gradient-to-br from-[#F0F4ED] to-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9CAF88] to-[#B5C9A4] flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-3xl">☀️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#3E3028] mb-1">
                  Beautiful Day Special!
                </h3>
                <p className="text-sm text-[#6B5D52] leading-relaxed mb-3">
                  It's gorgeous outside! Perfect weather for our garden seating. 
                  Enjoy 20% off all iced coffees today ☀️
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#9CAF88] text-white">Valid until 6pm</Badge>
                  <span className="text-xs text-[#6B5D52]">18°C · Sunny</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Enhanced */}
        <Card className="border-2 border-[#C9A961]/30 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#3E3028]">Quick Actions</CardTitle>
            <CardDescription className="text-[#6B5D52]">
              Share the love - bring a friend and you both get 10 beans! 💚
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="w-full bg-gradient-to-br from-[#8B6F47] to-[#A0826D] hover:from-[#6B5537] hover:to-[#8B6F47] text-white shadow-md border-0 h-auto py-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-semibold">Check In</span>
                </div>
              </Button>
              <Button 
                variant="outline"
                className="w-full border-2 border-[#9CAF88] text-[#3E3028] hover:bg-[#9CAF88]/10 h-auto py-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <Users className="w-5 h-5 text-[#9CAF88]" />
                  <span className="text-sm font-semibold">Refer Friends</span>
                </div>
              </Button>
              <Button 
                variant="outline"
                className="w-full border-2 border-[#C9A961] text-[#3E3028] hover:bg-[#C9A961]/10 h-auto py-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <Gift className="w-5 h-5 text-[#C9A961]" />
                  <span className="text-sm font-semibold">My Rewards</span>
                </div>
              </Button>
              <Button 
                variant="outline"
                className="w-full border-2 border-[#8B6F47] text-[#3E3028] hover:bg-[#8B6F47]/10 h-auto py-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <TrendingUp className="w-5 h-5 text-[#8B6F47]" />
                  <span className="text-sm font-semibold">Gift Shop</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Design Notes */}
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">🎨 Design Changes Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>Colors:</strong> Warmer browns, creams, sage green, gold accents</p>
            <p><strong>Typography:</strong> Better hierarchy, more readable</p>
            <p><strong>Personality:</strong> Personal messages from John & Amanda</p>
            <p><strong>New Features:</strong> Today's Specials, Weather offers, Better storytelling</p>
            <p><strong>Visual Polish:</strong> Gradients, shadows, decorative elements</p>
            <p className="pt-2 border-t border-blue-200">
              <strong>Note:</strong> This is a demo page. Your actual dashboard remains unchanged.
            </p>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
