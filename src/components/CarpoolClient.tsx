'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CarpoolCarWithPassengers } from '@/lib/db/carpool'
import CarCard from './CarCard'
import CarModal from './CarModal'
import CarRegisterModal from './CarRegisterModal'
import UnassignedList from './UnassignedList'

interface CarpoolClientProps {
  cars: CarpoolCarWithPassengers[]
  unassigned: { id: string; name: string; village: string }[]
  currentUser: { id: string; name: string; village: string } | null
}

export default function CarpoolClient({ cars, unassigned, currentUser }: CarpoolClientProps) {
  const router = useRouter()
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)

  const selectedCar = cars.find((c) => c.id === selectedCarId) ?? null

  const isAlreadyRegistered = currentUser
    ? cars.some(
        (c) =>
          c.driver_id === currentUser.id ||
          c.passengers.some((p) => p.user_id === currentUser.id)
      )
    : false

  const showRegisterButton = currentUser && !isAlreadyRegistered

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* 차량 목록 */}
        <div className="md:flex-[1.6]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">🚗 카풀</h1>
            {showRegisterButton && (
              <button
                onClick={() => setShowRegister(true)}
                className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700"
              >
                내 차 등록
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onClick={() => setSelectedCarId(car.id)}
              />
            ))}
            <button
              onClick={() => {
                if (!currentUser) {
                  alert('차량을 등록하려면 로그인하세요.')
                  return
                }
                setShowRegister(true)
              }}
              className="w-full text-left border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors text-sm"
            >
              + 차량 등록하기
            </button>
          </div>
        </div>

        {/* 미배정 명단 */}
        <div className="bg-yellow-50 rounded-2xl p-4 md:flex-[1] md:sticky md:top-4">
          <UnassignedList users={unassigned} />
        </div>
      </div>

      {selectedCar && (
        <CarModal
          car={selectedCar}
          currentUser={currentUser}
          unassigned={unassigned}
          onClose={() => setSelectedCarId(null)}
          isGloballyAssigned={isAlreadyRegistered}
        />
      )}

      {showRegister && (
        <CarRegisterModal
          onClose={() => {
            setShowRegister(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
