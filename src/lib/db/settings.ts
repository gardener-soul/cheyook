import { createServiceClient } from '@/lib/supabase/service'

export async function getScoreVisible(): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'score_visible')
    .maybeSingle()
  return data?.value !== 'false'
}

export async function setScoreVisible(visible: boolean): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('settings').delete().eq('key', 'score_visible')
  await supabase.from('settings').insert({ key: 'score_visible', value: String(visible) })
}
