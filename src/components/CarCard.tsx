import { CarpoolCarWithPassengers } from '@/lib/db/carpool'

interface CarCardProps {
  car: CarpoolCarWithPassengers
  onClick: () => void
}

function SeatDots({ capacity, passengerCount }: { capacity: number; passengerCount: number }) {
  const total = capacity + 1 // 운전자 포함
  const occupied = passengerCount + 1 // 운전자 포함
  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full border-2 ${
            i < occupied
              ? i === 0
                ? 'bg-blue-500 border-blue-500'
                : 'bg-green-500 border-green-500'
              : 'border-gray-300 bg-white'
          }`}
        />
      ))}
    </div>
  )
}

export default function CarCard({ car, onClick }: CarCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-base">{car.driver.name}</p>
          <p className="text-sm text-gray-500">{car.car_number}</p>
          <p className="text-sm text-gray-500">{car.contact}</p>
          {car.destination && (
            <p className="text-sm text-gray-600 mt-1">🏠 {car.destination}</p>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {car.passengers.length}/{car.capacity}
        </span>
      </div>
      <SeatDots capacity={car.capacity} passengerCount={car.passengers.length} />
    </button>
  )
}
