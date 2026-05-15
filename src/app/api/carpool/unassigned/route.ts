import { NextResponse } from 'next/server'
import { getUnassignedUsers } from '@/lib/db/carpool'

export async function GET() {
  const users = await getUnassignedUsers()
  return NextResponse.json(users)
}
