'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface GamesClientProps {
  games: any[]
}

export function GamesClient({ games: initialGames }: GamesClientProps) {
  const [games, setGames] = useState(initialGames)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const toggleGame = async (gameId: string, currentStatus: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update game')
      }

      toast({
        title: 'Success',
        description: `Game ${!currentStatus ? 'enabled' : 'disabled'}`,
      })

      router.refresh()
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Games Management</h1>
        <p className="text-muted-foreground">Configure mini-games and probabilities</p>
      </div>

      {/* Games List */}
      <div className="grid gap-4">
        {games.map((game) => (
          <Card key={game.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-3xl">{game.icon}</span>
                    {game.display_name}
                    {!game.enabled && (
                      <span className="text-xs bg-grey-light px-2 py-1 rounded">Disabled</span>
                    )}
                  </CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </div>
                <Button
                  variant={game.enabled ? 'destructive' : 'default'}
                  onClick={() => toggleGame(game.id, game.enabled)}
                  disabled={isLoading}
                >
                  {game.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Play Limit:</span>
                  <span className="font-medium">{game.play_limit_per_day} per day</span>
                </div>

                {/* Prize Distribution */}
                <div>
                  <h4 className="font-medium mb-3">Prize Distribution</h4>
                  <div className="space-y-2">
                    {game.game_prizes?.map((prize: any) => (
                      <div
                        key={prize.id}
                        className="flex items-center justify-between p-3 bg-grey-light rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{prize.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {prize.prize_type === 'ducks' && `${prize.prize_value} ducks`}
                            {prize.prize_type === 'reward' && 'Instant reward'}
                            {prize.prize_type === 'nothing' && 'No prize'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-penkey-orange">
                            {(prize.probability * 100).toFixed(1)}%
                          </p>
                          {prize.daily_limit && (
                            <p className="text-xs text-muted-foreground">
                              Limit: {prize.daily_limit}/day
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Probability Check */}
                <div className="p-3 bg-penkey-orange/10 border border-penkey-orange rounded-lg">
                  <p className="text-sm">
                    <strong>Total Probability:</strong>{' '}
                    {(game.game_prizes?.reduce((sum: number, p: any) => sum + p.probability, 0) * 100).toFixed(1)}%
                    {game.game_prizes?.reduce((sum: number, p: any) => sum + p.probability, 0) === 1 && ' ✓'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-penkey-orange">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Probability adjustments require database changes. 
            Contact your developer to modify prize probabilities or add new prizes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
