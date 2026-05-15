import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listCarsWithPassengers, createCar } from '@/lib/db/carpool'

export async function GET() {
  const cars = await listCarsWithPassengers()
  return NextResponse.json(cars)
}

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const body = await request.json()
  const { car_number, contact, capacity, destination } = body

  if (!car_number || !contact || !capacity) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }
  if (capacity < 2 || capacity > 4) {
    return NextResponse.json({ error: '탑승 인원은 2~4명' }, { status: 400 })
  }

  const car = await createCar(user.id, {
    car_number,
    contact,
    capacity: Number(capacity),
    destination: destination || null,
  })

  if (!car) return NextResponse.json({ error: '등록 실패 (이미 차량을 등록했을 수 있습니다)' }, { status: 400 })
  return NextResponse.json(car, { status: 201 })
}
