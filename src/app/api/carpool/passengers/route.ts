import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCarWithPassengers, addPassenger } from '@/lib/db/carpool'

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { car_id, user_id: targetId } = await request.json()
  if (!car_id) return NextResponse.json({ error: '차량 ID 필요' }, { status: 400 })

  const targetUserId: string = targetId ?? user.id

  const car = await getCarWithPassengers(car_id)
  if (!car) return NextResponse.json({ error: '차량 없음' }, { status: 404 })

  // 다른 사람 초대 시 운전자만 가능
  if (targetUserId !== user.id && car.driver_id !== user.id) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  // 정원 초과 확인
  if (car.passengers.length >= car.capacity) {
    return NextResponse.json({ error: '자리 없음' }, { status: 400 })
  }

  const { data, error } = await addPassenger(car_id, targetUserId)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
