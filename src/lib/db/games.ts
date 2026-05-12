import { createServiceClient } from '@/lib/supabase/service'
import type { Zone } from '@/lib/constants'

export type Game = {
  id: string
  name: string
  description: string | null
  zone: Zone
  max_participants: number | null
  points: number | null
  status: 'pending' | 'active' | 'completed'
  order_index: number
  winner_team: 'blue' | 'white' | 'draw' | null
  created_at: string
}

export async function listGames(): Promise<Game[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .order('order_index', { ascending: true })
  return data ?? []
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function createGame(input: {
  name: string
  description?: string
  zone: Zone
  max_participants?: number
  points?: number
  order_index: number
}): Promise<Game | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('games').insert(input).select().single()
  return data
}

export async function updateGame(id: string, input: Partial<Omit<Game, 'id' | 'created_at'>>): Promise<Game | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('games')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  return data
}

export async function deleteGame(id: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('games').delete().eq('id', id)
}
