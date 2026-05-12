import { createServiceClient } from '@/lib/supabase/service'

export type User = {
  id: string
  name: string
  village: string
  team: 'blue' | 'white' | null
  is_admin: boolean
  created_at: string
}

export async function findUser(name: string, village: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .eq('village', village)
    .maybeSingle()
  return data
}

export async function createUser(name: string, village: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .insert({ name, village, is_admin: name === 'admin' })
    .select()
    .single()
  return data
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}
