'use client'

import Link from 'next/link'

export default function Topbar() {
  return (
    <nav className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md z-30">
      <h1 className="text-lg font-bold tracking-tight">NeuroNest</h1>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="text-sm bg-blue-600 px-4 py-1.5 rounded hover:bg-blue-700 transition"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="text-sm bg-purple-600 px-4 py-1.5 rounded hover:bg-purple-700 transition"
        >
          Log in
        </Link>
      </div>
    </nav>
  )
}
