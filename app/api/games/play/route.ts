import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { invalidateAfterGamePlay } from '@/lib/cache/invalidation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
    }

    // Check if user can play this game
    const { data: canPlay } = await supabase
      .rpc('can_play_game', { p_user_id: user.id, p_game_id: gameId })

    if (!canPlay) {
      return NextResponse.json(
        { error: 'You have already played this game today!' },
        { status: 400 }
      )
    }

    // Get game prizes
    const { data: prizes } = await supabase
      .from('game_prizes')
      .select('*')
      .eq('game_id', gameId)

    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Select a prize based on probability
    const random = Math.random()
    let cumulativeProbability = 0
    let selectedPrize = prizes[0]

    for (const prize of prizes) {
      cumulativeProbability += prize.probability
      if (random <= cumulativeProbability) {
        selectedPrize = prize
        break
      }
    }

    // Check daily limit for this prize
    if (selectedPrize.daily_limit !== null) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayPlays } = await supabase
        .from('game_plays')
        .select('id')
        .eq('prize_type', selectedPrize.prize_type)
        .eq('prize_value', selectedPrize.prize_value)
        .gte('created_at', today.toISOString())

      if (todayPlays && todayPlays.length >= selectedPrize.daily_limit) {
        // Daily limit reached, give nothing instead
        selectedPrize = prizes.find(p => p.prize_type === 'nothing') || selectedPrize
      }
    }

    // Award the prize as PENDING (claimed on check-in)
    let rewardId = null
    let pointsAwarded = 0
    let isPending = false

    // For reward prizes, create the voucher but keep it inactive
    if (selectedPrize.prize_type === 'reward') {
      // Check if user can receive a reward (prevent stacking)
      const { data: canReceive } = await supabase
        .rpc('can_receive_reward_prize', {
          p_user_id: user.id,
          p_reward_name: null // Check for any active reward
        })

      if (canReceive) {
        // Get a random active reward
        const { data: activeRewards } = await supabase
          .from('rewards')
          .select('*')
          .eq('active', true)
          .gt('stock', 0)
          .or('stock.is.null')

        if (activeRewards && activeRewards.length > 0) {
          const randomReward = activeRewards[Math.floor(Math.random() * activeRewards.length)]
          rewardId = randomReward.id

          // Create the voucher but keep it PENDING (status will be updated on check-in)
          const { error: rewardError } = await supabase
            .from('user_rewards')
            .insert({
              user_id: user.id,
              reward_id: randomReward.id,
              qr_code: 'RWD-' + Math.random().toString(36).substr(2, 12).toUpperCase(),
              status: 'pending', // Will be activated on check-in
              expires_at: randomReward.expiry_days
                ? new Date(Date.now() + randomReward.expiry_days * 24 * 60 * 60 * 1000).toISOString()
                : null,
            })

          if (rewardError) throw rewardError

          // Decrease stock if applicable
          if (randomReward.stock !== null) {
            await supabase
              .from('rewards')
              .update({ stock: randomReward.stock - 1 })
              .eq('id', randomReward.id)
          }
        }
      } else {
        // User already has an active reward, give them nothing instead
        selectedPrize = prizes.find(p => p.prize_type === 'nothing') || selectedPrize
      }
    }

    // Log the game play FIRST
    const { data: gamePlay, error: gamePlayError } = await supabase
      .from('game_plays')
      .insert({
        user_id: user.id,
        game_id: gameId,
        prize_type: selectedPrize.prize_type,
        prize_value: selectedPrize.prize_value,
        prize_label: selectedPrize.label,
        reward_id: rewardId,
        status: selectedPrize.prize_type === 'nothing' ? 'claimed' : 'pending',
      })
      .select()
      .single()

    if (gamePlayError) throw gamePlayError

    // Award prize as pending (points, stamps, or voucher)
    const { data: pendingResult } = await supabase
      .rpc('award_game_prize_pending', {
        p_user_id: user.id,
        p_game_id: gameId,
        p_prize_type: selectedPrize.prize_type,
        p_prize_value: selectedPrize.prize_value,
        p_prize_label: selectedPrize.label,
        p_reward_id: rewardId
      })

    isPending = pendingResult?.pending || false
    pointsAwarded = selectedPrize.prize_type === 'points' ? selectedPrize.prize_value : 0

    // Update game_play with pending_reward_id if one was created
    if (isPending && pendingResult?.pending_id && gamePlay?.id) {
      await supabase
        .from('game_plays')
        .update({ pending_reward_id: pendingResult.pending_id })
        .eq('id', gamePlay.id)
    }

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      action: 'game_play',
      details: {
        game_id: gameId,
        prize: selectedPrize.label,
      },
    })

    // Invalidate caches after game play
    invalidateAfterGamePlay(user.id)

    return NextResponse.json({
      success: true,
      prize: {
        type: selectedPrize.prize_type,
        value: selectedPrize.prize_value,
        label: selectedPrize.label,
        rewardId,
      },
      pointsAwarded,
      isPending,
      message: isPending 
        ? `You won ${selectedPrize.label}! Check in at Penkey to claim it.`
        : selectedPrize.prize_type === 'nothing'
        ? 'Better luck next time!'
        : `You won ${selectedPrize.label}!`
    })
  } catch (error: any) {
    console.error('Game play error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to play game' },
      { status: 500 }
    )
  }
}
