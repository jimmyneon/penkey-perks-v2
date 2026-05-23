import { createClient } from '@/lib/supabase/server'
import { GamesClient } from './games-client'

export default async function AdminGamesPage() {
  const supabase = await createClient()

  // Get all games with their prizes
  const { data: games } = await supabase
    .from('mini_games')
    .select(`
      *,
      game_prizes (*)
    `)
    .order('name')

  return <GamesClient games={games || []} />
}
