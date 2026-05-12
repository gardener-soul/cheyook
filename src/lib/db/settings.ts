import { createServiceClient } from '@/lib/supabase/service'

export async function getScoreVisible(): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'score_visible')
    .single()
  return data?.value !== 'false'
}

export async function setScoreVisible(visible: boolean): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('settings')
    .upsert({ key: 'score_visible', value: String(visible) })
}
