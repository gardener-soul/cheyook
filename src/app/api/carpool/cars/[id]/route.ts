import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCarById, updateCar, deleteCar } from '@/lib/db/carpool'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const car = await getCarById(id)
  if (!car) return NextResponse.json({ error: '차량 없음' }, { status: 404 })
  if (car.driver_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await request.json()
  const { car_number, contact, capacity, destination } = body

  if (capacity !== undefined && (capacity < 2 || capacity > 4)) {
    return NextResponse.json({ error: '탑승 인원은 2~4명' }, { status: 400 })
  }

  const updated = await updateCar(id, {
    ...(car_number !== undefined && { car_number }),
    ...(contact !== undefined && { contact }),
    ...(capacity !== undefined && { capacity: Number(capacity) }),
    ...(destination !== undefined && { destination: destination || null }),
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const car = await getCarById(id)
  if (!car) return NextResponse.json({ error: '차량 없음' }, { status: 404 })
  if (car.driver_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await deleteCar(id)
  return NextResponse.json({ ok: true })
}
