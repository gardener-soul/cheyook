import { getSession } from '@/lib/auth'
import { listCarsWithPassengers, getUnassignedUsers } from '@/lib/db/carpool'
import CarpoolClient from '@/components/CarpoolClient'

export default async function CarpoolPage() {
  const [cars, unassigned, user] = await Promise.all([
    listCarsWithPassengers(),
    getUnassignedUsers(),
    getSession(),
  ])

  return (
    <CarpoolClient
      cars={cars}
      unassigned={unassigned}
      currentUser={user ? { id: user.id, name: user.name, village: user.village } : null}
    />
  )
}
