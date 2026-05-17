'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VILLAGES } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const [village, setVillage] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, village }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    router.push(data.isAdmin ? '/admin' : '/')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto mt-6 sm:mt-12">
      <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">마을</label>
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">마을 선택</option>
            {VILLAGES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="이름 입력"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <p className="text-center text-sm text-gray-500">
          처음이세요? <Link href="/register" className="text-blue-600">가입하기</Link>
        </p>
      </form>
    </div>
  )
}
