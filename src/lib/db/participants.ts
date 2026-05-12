import { createServiceClient } from '@/lib/supabase/service'

export type Participant = {
  id: string
  game_id: string
  user_id: string
  status: 'registered' | 'selected' | 'rejected'
  created_at: string
  users?: { name: string; village: string }
}

export async function getParticipants(gameId: string): Promise<Participant[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .select('*, users(name, village)')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function joinGame(gameId: string, userId: string): Promise<Participant | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .insert({ game_id: gameId, user_id: userId })
    .select()
    .single()
  return data
}

export async function leaveGame(gameId: string, userId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('game_participants')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', userId)
}

export async function getParticipation(gameId: string, userId: string): Promise<Participant | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .select('*')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function updateParticipantStatus(
  id: string,
  status: 'registered' | 'selected' | 'rejected'
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('game_participants')
    .update({ status })
    .eq('id', id)
}

export async function selectRandomParticipants(gameId: string, count: number): Promise<void> {
  const supabase = createServiceClient()
  const { data: all } = await supabase
    .from('game_participants')
    .select('id')
    .eq('game_id', gameId)

  if (!all) return

  const shuffled = [...all].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count).map((p) => p.id)
  const rejected = shuffled.slice(count).map((p) => p.id)

  if (selected.length > 0) {
    await supabase
      .from('game_participants')
      .update({ status: 'selected' })
      .in('id', selected)
  }
  if (rejected.length > 0) {
    await supabase
      .from('game_participants')
      .update({ status: 'rejected' })
      .in('id', rejected)
  }
}
