import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPassengerById, removePassenger } from '@/lib/db/carpool'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const passenger = await getPassengerById(id)
  if (!passenger) return NextResponse.json({ error: '없음' }, { status: 404 })

  const isOwnRecord = passenger.user_id === user.id
  const isDriver = passenger.car?.driver_id === user.id

  if (!isOwnRecord && !isDriver) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  await removePassenger(id)
  return NextResponse.json({ ok: true })
}
