'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CarpoolCarWithPassengers } from '@/lib/db/carpool'

interface CarRegisterModalProps {
  car?: CarpoolCarWithPassengers
  onClose: () => void
}

export default function CarRegisterModal({ car, onClose }: CarRegisterModalProps) {
  const router = useRouter()
  const [carNumber, setCarNumber] = useState(car?.car_number ?? '')
  const [contact, setContact] = useState(car?.contact ?? '')
  const [capacity, setCapacity] = useState(car?.capacity ?? 3)
  const [destination, setDestination] = useState(car?.destination ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!car

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const body = { car_number: carNumber, contact, capacity, destination: destination || null }

    const res = isEdit
      ? await fetch(`/api/carpool/cars/${car.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/carpool/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '오류가 발생했습니다')
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">{isEdit ? '차량 수정' : '내 차 등록'}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">차 번호</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="예: 가나1234"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">연락처</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="010-0000-0000"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">탑승 가능 인원 (운전자 제외)</label>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCapacity(n)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    capacity === n
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">목적지 (선택 — 귀가 카풀용)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="예: 강남역"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '저장 중...' : isEdit ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
