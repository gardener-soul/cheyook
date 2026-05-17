'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ZONES } from '@/lib/constants'

export default function GameForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    description: '',
    zone: 'full',
    max_participants: '',
    points: '',
    order_index: '0',
  })
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        zone: form.zone,
        max_participants: form.max_participants ? Number(form.max_participants) : undefined,
        points: form.points ? Number(form.points) : undefined,
        order_index: Number(form.order_index),
      }),
    })
    setLoading(false)
    setForm({ name: '', description: '', zone: 'full', max_participants: '', points: '', order_index: '0' })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
      <h2 className="font-semibold">게임 추가</h2>
      <input
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        required
        placeholder="게임 이름"
        className="border rounded px-3 py-2 text-sm"
      />
      <textarea
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="게임 설명 (선택)"
        className="border rounded px-3 py-2 text-sm"
        rows={2}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">구역</label>
          <select
            value={form.zone}
            onChange={(e) => set('zone', e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            {Object.entries(ZONES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">순서</label>
          <input
            type="number"
            value={form.order_index}
            onChange={(e) => set('order_index', e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">배점 (점)</label>
          <input
            type="number"
            value={form.points}
            onChange={(e) => set('points', e.target.value)}
            placeholder="미정"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">참가 제한 (명)</label>
          <input
            type="number"
            value={form.max_participants}
            onChange={(e) => set('max_participants', e.target.value)}
            placeholder="제한 없음"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50"
      >
        {loading ? '추가 중...' : '게임 추가'}
      </button>
    </form>
  )
}
