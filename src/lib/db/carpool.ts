import { createServiceClient } from '@/lib/supabase/service'

export type CarpoolCar = {
  id: string
  driver_id: string
  car_number: string
  contact: string
  capacity: number
  destination: string | null
  created_at: string
}

export type CarpoolPassenger = {
  id: string
  car_id: string
  user_id: string
  created_at: string
  users?: { name: string; village: string }
}

export type CarpoolCarWithPassengers = CarpoolCar & {
  driver: { name: string; village: string }
  passengers: CarpoolPassenger[]
}

export async function listCarsWithPassengers(): Promise<CarpoolCarWithPassengers[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('carpool_cars')
    .select('*, driver:users!driver_id(name, village), passengers:carpool_passengers(id, car_id, user_id, created_at, users(name, village))')
    .order('created_at', { ascending: true })
  return (data ?? []) as CarpoolCarWithPassengers[]
}

export async function getCarById(carId: string): Promise<CarpoolCar | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('carpool_cars')
    .select('*')
    .eq('id', carId)
    .maybeSingle()
  return data
}

export async function getCarWithPassengers(carId: string): Promise<CarpoolCarWithPassengers | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('carpool_cars')
    .select('*, driver:users!driver_id(name, village), passengers:carpool_passengers(id, car_id, user_id, created_at, users(name, village))')
    .eq('id', carId)
    .maybeSingle()
  return data as CarpoolCarWithPassengers | null
}

export async function createCar(
  driverId: string,
  data: { car_number: string; contact: string; capacity: number; destination: string | null }
): Promise<CarpoolCar | null> {
  const supabase = createServiceClient()
  const { data: car } = await supabase
    .from('carpool_cars')
    .insert({ driver_id: driverId, ...data })
    .select()
    .single()
  return car
}

export async function updateCar(
  carId: string,
  data: { car_number?: string; contact?: string; capacity?: number; destination?: string | null }
): Promise<CarpoolCar | null> {
  const supabase = createServiceClient()
  const { data: car } = await supabase
    .from('carpool_cars')
    .update(data)
    .eq('id', carId)
    .select()
    .single()
  return car
}

export async function deleteCar(carId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('carpool_cars').delete().eq('id', carId)
}

export async function addPassenger(
  carId: string,
  userId: string
): Promise<{ data: CarpoolPassenger | null; error: string | null }> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('carpool_passengers')
    .insert({ car_id: carId, user_id: userId })
    .select()
    .single()
  if (error?.code === '23505') return { data: null, error: '이미 배정된 사용자입니다' }
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function removePassenger(passengerId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('carpool_passengers').delete().eq('id', passengerId)
}

export type PassengerWithCar = CarpoolPassenger & {
  car: { driver_id: string }
}

export async function getPassengerById(passengerId: string): Promise<PassengerWithCar | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('carpool_passengers')
    .select('*, car:carpool_cars(driver_id)')
    .eq('id', passengerId)
    .maybeSingle()
  return data as PassengerWithCar | null
}

export async function getUnassignedUsers(): Promise<{ id: string; name: string; village: string }[]> {
  const supabase = createServiceClient()
  const [{ data: cars }, { data: passengers }] = await Promise.all([
    supabase.from('carpool_cars').select('driver_id'),
    supabase.from('carpool_passengers').select('user_id'),
  ])
  const assignedIds = [
    ...(cars ?? []).map((c) => c.driver_id),
    ...(passengers ?? []).map((p) => p.user_id),
  ]
  let query = supabase
    .from('users')
    .select('id, name, village')
    .order('name', { ascending: true })
  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }
  const { data } = await query
  return data ?? []
}
