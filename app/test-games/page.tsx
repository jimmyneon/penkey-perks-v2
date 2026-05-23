'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Gamepad2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ExternalLink,
  Database,
  Play,
  Settings
} from 'lucide-react'

interface GameInfo {
  id: string
  name: string
  display_name: string
  description: string
  icon: string
  enabled: boolean
  play_limit_per_day: number
  route: string
}

export default function TestGamesPage() {
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [playHistory, setPlayHistory] = useState<any[]>([])
  const supabase = createClient()

  const allGames: GameInfo[] = [
    {
      id: 'dice_roll',
      name: 'dice_roll',
      display_name: 'Lucky Dice Roll',
      description: 'Roll dice to match special combinations',
      icon: '🎲',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/dice_roll'
    },
    {
      id: 'duck_memory',
      name: 'duck_memory',
      display_name: 'Duck Memory Match',
      description: 'Match pairs of colored ducks',
      icon: '🦆',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/duck_memory'
    },
    {
      id: 'monkey_penguin',
      name: 'monkey_penguin',
      display_name: 'Monkey vs Penguin Race',
      description: 'Tap rapidly to win the race',
      icon: '🐧',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/monkey_penguin'
    },
    {
      id: 'cup_stack',
      name: 'cup_stack',
      display_name: 'Coffee Cup Stack',
      description: 'Stack cups without toppling',
      icon: '☕',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/cup_stack'
    },
    {
      id: 'donut_catcher',
      name: 'donut_catcher',
      display_name: 'Donut Catcher',
      description: 'Catch falling treats',
      icon: '🍩',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/donut_catcher'
    },
    {
      id: 'hungry_hippo',
      name: 'hungry_hippo',
      display_name: 'Hungry Hippo',
      description: 'Catch falling treats in the hippo\'s mouth!',
      icon: '🦛',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/hungry_hippo'
    },
    {
      id: 'coffee_snake',
      name: 'coffee_snake',
      display_name: 'Coffee Snake',
      description: 'Classic snake game with coffee cups!',
      icon: '🐍',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/coffee_snake'
    },
    // Existing games
    {
      id: 'scratch_card',
      name: 'scratch_card',
      display_name: 'Scratch Card',
      description: 'Scratch to reveal your prize',
      icon: '🎫',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/scratch_card'
    },
    {
      id: 'spin_wheel',
      name: 'spin_wheel',
      display_name: 'Spin Wheel',
      description: 'Spin the wheel to win',
      icon: '🎡',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/spin_wheel'
    },
    {
      id: 'duck_pond',
      name: 'duck_pond',
      display_name: 'Duck Pond',
      description: 'Pick a lucky duck',
      icon: '🦆',
      enabled: true,
      play_limit_per_day: 1,
      route: '/games/duck_pond'
    },
  ]

  useEffect(() => {
    checkDatabase()
    loadGames()
    loadPlayHistory()
  }, [])

  const checkDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('mini_games')
        .select('count')
        .limit(1)

      if (error) throw error
      setDbStatus('connected')
    } catch (error) {
      console.error('Database check failed:', error)
      setDbStatus('error')
    }
  }

  const loadGames = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('mini_games')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        const dbGames = data.map(game => ({
          ...game,
          route: `/games/${game.name}`
        }))
        setGames(dbGames)
      } else {
        // Use local game list if DB not set up yet
        setGames(allGames)
      }
    } catch (error) {
      console.error('Error loading games:', error)
      setGames(allGames)
    } finally {
      setLoading(false)
    }
  }

  const loadPlayHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('game_plays')
        .select(`
          *,
          mini_games (name, display_name, icon)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setPlayHistory(data || [])
    } catch (error) {
      console.error('Error loading play history:', error)
    }
  }

  const resetPlayHistory = async () => {
    if (!confirm('Reset your play history for today? This will let you test games again.')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { error } = await supabase
        .from('game_plays')
        .delete()
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())

      if (error) throw error

      alert('Play history reset! You can now test games again.')
      loadPlayHistory()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-penkey-orange" />
            <div>
              <h1 className="text-2xl font-bold">Game Diagnostics</h1>
              <p className="text-sm text-penkey-gray">Test all mini-games and check database status</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Connection</span>
              <div className="flex items-center gap-2">
                {dbStatus === 'checking' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-blue-500">Checking...</span>
                  </>
                )}
                {dbStatus === 'connected' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">Connected</span>
                  </>
                )}
                {dbStatus === 'error' && (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">Error</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Games in Database</span>
              <span className="text-sm font-bold text-penkey-orange">{games.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plays Today</span>
              <span className="text-sm font-bold text-penkey-orange">{playHistory.length}</span>
            </div>

            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetPlayHistory}
                className="w-full"
              >
                Reset Play History (Testing Only)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              All Games ({allGames.length})
            </CardTitle>
            <CardDescription>
              Click any game to test it. New games may not be in the database yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-penkey-orange" />
                <p className="text-penkey-gray">Loading games...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGames.map((game) => {
                  const inDb = games.find(g => g.name === game.name)
                  const hasPlayed = playHistory.some((p: any) => p.mini_games?.name === game.name)

                  return (
                    <Card key={game.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {/* Status Badges */}
                          <div className="flex gap-2 flex-wrap">
                            {inDb ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ In DB
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                ⚠ Not in DB
                              </span>
                            )}
                            {hasPlayed && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                ✓ Played Today
                              </span>
                            )}
                          </div>

                          {/* Game Info */}
                          <div className="text-center">
                            <div className="text-6xl mb-2">{game.icon}</div>
                            <h3 className="font-bold text-lg">{game.display_name}</h3>
                            <p className="text-xs text-penkey-gray mt-1">{game.description}</p>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            <Link href={game.route} className="block">
                              <Button className="w-full" size="sm">
                                <Play className="w-4 h-4 mr-2" />
                                Test Game
                              </Button>
                            </Link>
                            <div className="text-xs text-center text-penkey-gray">
                              Route: <code className="bg-gray-100 px-1 rounded">{game.route}</code>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Play History */}
        {playHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Play History</CardTitle>
              <CardDescription>Your last 10 game plays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playHistory.map((play: any, index) => (
                  <div 
                    key={play.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{play.mini_games?.icon || '🎮'}</span>
                      <div>
                        <p className="font-medium text-sm">{play.mini_games?.display_name || 'Unknown Game'}</p>
                        <p className="text-xs text-penkey-gray">
                          {new Date(play.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-penkey-orange">
                        {play.prize_type === 'points' && `+${play.prize_value} pts`}
                        {play.prize_type === 'stamps' && `+${play.prize_value} ☕`}
                        {play.prize_type === 'reward' && '🎁 Reward'}
                        {play.prize_type === 'nothing' && '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card className="bg-penkey-orange/5 border-penkey-orange">
          <CardContent className="pt-6">
            <h3 className="font-bold mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/games">
                <Button variant="outline" size="sm" className="w-full">
                  Admin Panel
                </Button>
              </Link>
              <Link href="/test-gps">
                <Button variant="outline" size="sm" className="w-full">
                  GPS Test
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-bold mb-1">1. Add Games to Database</h4>
              <p className="text-penkey-gray">
                Run the migration file to add new games to the <code className="bg-gray-100 px-1 rounded">mini_games</code> table.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-1">2. Configure Prizes</h4>
              <p className="text-penkey-gray">
                Set up prize probabilities in the <code className="bg-gray-100 px-1 rounded">game_prizes</code> table for each game.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-1">3. Test Games</h4>
              <p className="text-penkey-gray">
                Click "Test Game" on any game above. Use "Reset Play History" to test multiple times.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-1">4. Replace Assets</h4>
              <p className="text-penkey-gray">
                Add custom images to <code className="bg-gray-100 px-1 rounded">/public/game-assets/</code> folders to replace emoji placeholders.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
