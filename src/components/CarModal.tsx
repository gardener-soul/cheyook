'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CarpoolCarWithPassengers } from '@/lib/db/carpool'
import UnassignedList from './UnassignedList'
import CarRegisterModal from './CarRegisterModal'

interface CarModalProps {
  car: CarpoolCarWithPassengers
  currentUser: { id: string; name: string } | null
  unassigned: { id: string; name: string; village: string }[]
  onClose: () => void
}

export default function CarModal({ car, currentUser, unassigned, onClose }: CarModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const isDriver = currentUser?.id === car.driver_id
  const myPassenger = car.passengers.find((p) => p.user_id === currentUser?.id)
  const isFull = car.passengers.length >= car.capacity
  const isUnassigned = !myPassenger && !isDriver

  async function handleJoin() {
    setLoading(true)
    await fetch('/api/carpool/passengers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ car_id: car.id }),
    })
    setLoading(false)
    router.refresh()
  }

  async function handleLeave() {
    if (!myPassenger) return
    setLoading(true)
    await fetch(`/api/carpool/passengers/${myPassenger.id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  async function handleKick(passengerId: string) {
    setLoading(true)
    await fetch(`/api/carpool/passengers/${passengerId}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  async function handleInvite(userId: string) {
    setLoading(true)
    await fetch('/api/carpool/passengers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ car_id: car.id, user_id: userId }),
    })
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('차량을 삭제하면 탑승자 전원이 미배정으로 돌아갑니다. 삭제할까요?')) return
    setLoading(true)
    await fetch(`/api/carpool/cars/${car.id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
    onClose()
  }

  if (showEdit) {
    return (
      <CarRegisterModal
        car={car}
        onClose={() => {
          setShowEdit(false)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{car.driver.name}의 차</h2>
            <p className="text-sm text-gray-500">{car.car_number} · {car.contact}</p>
            {car.destination && (
              <p className="text-sm text-gray-600 mt-0.5">🏠 {car.destination}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* 탑승자 목록 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500 mb-2">탑승자 ({car.passengers.length}/{car.capacity})</p>
          <ul className="flex flex-col gap-1">
            {/* 운전자 */}
            <li className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">🚗 {car.driver.name} (운전자)</span>
            </li>
            {/* 탑승자 */}
            {car.passengers.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm">{p.users?.name ?? '알 수 없음'}</span>
                {isDriver && (
                  <button
                    onClick={() => handleKick(p.id)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50"
                  >
                    ✕ 내보내기
                  </button>
                )}
              </li>
            ))}
            {/* 빈 자리 */}
            {Array.from({ length: car.capacity - car.passengers.length }).map((_, i) => (
              <li key={`empty-${i}`} className="px-3 py-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <span className="text-sm text-gray-300">빈 자리</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 일반 사용자 액션 */}
        {currentUser && !isDriver && (
          <div className="mb-4">
            {myPassenger ? (
              <button
                onClick={handleLeave}
                disabled={loading}
                className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50"
              >
                🚪 탑승 취소
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={loading || isFull || !isUnassigned}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFull ? '자리 없음' : !isUnassigned ? '이미 배정됨' : '🙋 나도 탑승하기'}
              </button>
            )}
          </div>
        )}

        {!currentUser && (
          <p className="text-sm text-gray-500 text-center mb-4">탑승 신청하려면 로그인하세요.</p>
        )}

        {/* 운전자 액션 */}
        {isDriver && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowInvite(!showInvite)}
              disabled={loading || isFull}
              className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm hover:bg-blue-50 disabled:opacity-50"
            >
              👋 미배정 명단에서 초대하기
            </button>

            {showInvite && (
              <div className="bg-yellow-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                <UnassignedList users={unassigned} onInvite={handleInvite} />
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
