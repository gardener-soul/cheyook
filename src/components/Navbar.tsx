import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function Navbar() {
  const user = await getSession()

  return (
    <nav className="bg-blue-600 px-4 py-3 flex items-center justify-between shadow-md">
      <Link href="/" className="font-bold text-xl text-white tracking-tight">
        🏃 체육대회
      </Link>
      <div className="flex gap-3 items-center">
        {user ? (
          <>
            <span className="text-blue-100 text-sm">{user.village} · {user.name}</span>
            {user.is_admin && (
              <Link
                href="/admin"
                className="bg-white text-blue-600 font-semibold px-3 py-1 rounded-full text-xs hover:bg-blue-50 transition-colors"
              >
                관리자
              </Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-blue-200 hover:text-white text-xs transition-colors"
              >
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-100 hover:text-white text-sm transition-colors">
              로그인
            </Link>
            <Link
              href="/register"
              className="bg-white text-blue-600 font-semibold px-3 py-1 rounded-full text-sm hover:bg-blue-50 transition-colors"
            >
              가입
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
