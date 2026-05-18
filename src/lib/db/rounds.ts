import { createServiceClient } from '@/lib/supabase/service'

export type GameRound = {
  id: string
  game_id: string
  round_number: number
  winner_team: 'blue' | 'white' | 'draw'
  points_awarded: number
  created_at: string
}

export async function listRounds(gameId: string): Promise<GameRound[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .order('round_number', { ascending: true })
  return data ?? []
}

export async function addRound(input: {
  game_id: string
  round_number: number
  winner_team: 'blue' | 'white' | 'draw'
  points_awarded: number
}): Promise<GameRound | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_rounds')
    .insert(input)
    .select()
    .single()
  return data
}
