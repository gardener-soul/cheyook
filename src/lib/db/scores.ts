import { createServiceClient } from '@/lib/supabase/service'

export type ScoreLog = {
  id: string
  game_id: string | null
  team: 'blue' | 'white'
  points: number
  reason: string | null
  created_by: string
  created_at: string
}

export type TeamScores = { blue: number; white: number }

export async function getTeamScores(): Promise<TeamScores> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('score_logs').select('team, points')
  if (!data) return { blue: 0, white: 0 }
  return data.reduce(
    (acc, row) => {
      acc[row.team as 'blue' | 'white'] += row.points
      return acc
    },
    { blue: 0, white: 0 }
  )
}

export async function listScoreLogs(): Promise<ScoreLog[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('score_logs')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addScore(input: {
  team: 'blue' | 'white'
  points: number
  reason?: string
  created_by: string
  game_id?: string
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('score_logs').insert(input)
}
