'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, Coffee, Gamepad2, Gift, CheckCircle, TrendingUp, Sparkles } from 'lucide-react'

interface PointsConfig {
  action_type: string
  points_amount: number
  description: string
  active: boolean
}

interface HowItWorksDynamicProps {
  pointsConfigs: PointsConfig[]
}

export function HowItWorksDynamic({ pointsConfigs }: HowItWorksDynamicProps) {
  // Extract specific point values from config
  const getPoints = (actionType: string) => {
    const config = pointsConfigs.find(c => c.action_type === actionType && c.active)
    return config?.points_amount || 0
  }

  const signupPoints = getPoints('signup')
  const checkinPoints = getPoints('daily_checkin')
  const referralPoints = getPoints('referral_signup')
  const gameSmall = getPoints('game_win_small')
  const gameMedium = getPoints('game_win_medium')
  const gameLarge = getPoints('game_win_large')
  const gameJackpot = getPoints('game_win_jackpot')

  // Get all active point-earning actions
  const pointActions = pointsConfigs.filter(c => 
    c.active && 
    c.points_amount > 0 &&
    ['signup', 'daily_checkin', 'referral_signup', 'game_win_small', 'game_win_medium', 'game_win_large', 'game_win_jackpot', 'social_share', 'review_posted', 'birthday_bonus'].includes(c.action_type)
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-heading font-bold text-penkey-dark">
          How Penkey Perks Works
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Three ways to earn rewards at Penkey! Collect beans, stamp your card, and play games.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Beans System */}
        <Card className="border-2 border-penkey-orange/20 hover:border-penkey-orange/40 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-penkey-orange/10 flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-penkey-orange" />
            </div>
            <CardTitle className="text-xl">Earn Beans</CardTitle>
            <CardDescription>
              Collect beans for every visit and activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {signupPoints > 0 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-penkey-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Sign Up Bonus</p>
                    <p className="text-xs text-muted-foreground">Get {signupPoints} beans when you join</p>
                  </div>
                </div>
              )}
              
              {checkinPoints > 0 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-penkey-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Daily Check-In</p>
                    <p className="text-xs text-muted-foreground">Earn {checkinPoints} beans per visit</p>
                  </div>
                </div>
              )}
              
              {(gameSmall > 0 || gameMedium > 0 || gameJackpot > 0) && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-penkey-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Game Wins</p>
                    <p className="text-xs text-muted-foreground">
                      Win {gameSmall}-{gameJackpot} beans playing games
                    </p>
                  </div>
                </div>
              )}
              
              {referralPoints > 0 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-penkey-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Refer Friends</p>
                    <p className="text-xs text-muted-foreground">Get {referralPoints} beans per referral</p>
                  </div>
                </div>
              )}

              {/* Show other active point actions */}
              {pointActions
                .filter(a => !['signup', 'daily_checkin', 'referral_signup', 'game_win_small', 'game_win_medium', 'game_win_large', 'game_win_jackpot'].includes(a.action_type))
                .slice(0, 2)
                .map(action => (
                  <div key={action.action_type} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-penkey-orange mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {action.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.points_amount} beans - {action.description}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-penkey-orange" />
                <span className="font-medium">Redeem for rewards</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use beans to unlock discounts and free items
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coffee Stamps */}
        <Card className="border-2 border-penkey-teal/20 hover:border-penkey-teal/40 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-penkey-teal/10 flex items-center justify-center mb-4">
              <Coffee className="w-6 h-6 text-penkey-teal" />
            </div>
            <CardTitle className="text-xl">Coffee Stamps</CardTitle>
            <CardDescription>
              Collect stamps for every coffee purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-penkey-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Buy Coffee</p>
                  <p className="text-xs text-muted-foreground">Get 1 stamp per coffee</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-penkey-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Collect 10 Stamps</p>
                  <p className="text-xs text-muted-foreground">Fill your stamp card</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-penkey-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Get Free Coffee!</p>
                  <p className="text-xs text-muted-foreground">Automatic reward at 10 stamps</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-penkey-teal/10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-penkey-teal" />
                  <p className="text-sm font-medium text-penkey-teal">
                    Bonus Stamps from Games
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Win stamps by playing mini-games
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games */}
        <Card className="border-2 border-penkey-purple/20 hover:border-penkey-purple/40 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-penkey-purple/10 flex items-center justify-center mb-4">
              <Gamepad2 className="w-6 h-6 text-penkey-purple" />
            </div>
            <CardTitle className="text-xl">Play Games</CardTitle>
            <CardDescription>
              Win beans, stamps, and special prizes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-penkey-purple mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Daily Free Play</p>
                  <p className="text-xs text-muted-foreground">Play once per day for free</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-penkey-purple mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Multiple Games</p>
                  <p className="text-xs text-muted-foreground">Donut Catcher, Spin Wheel & more</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-penkey-purple mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Win Prizes</p>
                  <p className="text-xs text-muted-foreground">Beans, stamps, or special rewards</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                {gameSmall > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Small Prize</span>
                    <span className="font-medium">{gameSmall} beans</span>
                  </div>
                )}
                {gameMedium > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Medium Prize</span>
                    <span className="font-medium">{gameMedium} beans</span>
                  </div>
                )}
                {gameLarge > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Large Prize</span>
                    <span className="font-medium">{gameLarge} beans</span>
                  </div>
                )}
                {gameJackpot > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Jackpot</span>
                    <span className="font-medium text-penkey-orange">{gameJackpot} beans!</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats - Dynamic */}
      <Card className="bg-gradient-to-br from-penkey-orange/5 to-penkey-teal/5 border-penkey-orange/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {signupPoints > 0 && (
              <div>
                <div className="text-3xl font-bold text-penkey-orange">{signupPoints}</div>
                <div className="text-xs text-muted-foreground mt-1">Signup Bonus</div>
              </div>
            )}
            {checkinPoints > 0 && (
              <div>
                <div className="text-3xl font-bold text-penkey-teal">{checkinPoints}</div>
                <div className="text-xs text-muted-foreground mt-1">Beans Per Visit</div>
              </div>
            )}
            <div>
              <div className="text-3xl font-bold text-penkey-purple">10</div>
              <div className="text-xs text-muted-foreground mt-1">Stamps = Free Coffee</div>
            </div>
            {gameJackpot > 0 && (
              <div>
                <div className="text-3xl font-bold text-penkey-orange">{gameJackpot}</div>
                <div className="text-xs text-muted-foreground mt-1">Max Game Prize</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips - Dynamic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-penkey-orange" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {checkinPoints > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-penkey-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-penkey-orange">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Check in daily</p>
                  <p className="text-xs text-muted-foreground">Earn {checkinPoints} beans every day you visit</p>
                </div>
              </div>
            )}
            
            {(gameSmall > 0 || gameJackpot > 0) && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-penkey-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-penkey-teal">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Play games daily</p>
                  <p className="text-xs text-muted-foreground">Free daily plays can win you bonus beans</p>
                </div>
              </div>
            )}
            
            {referralPoints > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-penkey-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-penkey-purple">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Refer friends</p>
                  <p className="text-xs text-muted-foreground">Get {referralPoints} beans for each friend who signs up</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-penkey-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-penkey-orange">4</span>
              </div>
              <div>
                <p className="text-sm font-medium">Save for big rewards</p>
                <p className="text-xs text-muted-foreground">Higher bean rewards have better value</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
