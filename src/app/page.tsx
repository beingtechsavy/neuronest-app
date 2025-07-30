'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      
      {/* MASSIVE BRAIN ICON */}
      <div className="text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] leading-none mb-4 select-none">
        🧠
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center leading-tight">
        Welcome to <span className="text-purple-400">NeuroNest</span>
      </h1>

      <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl text-center">
        An ADHD-friendly task manager designed for simplicity, focus, and building better routines.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/signup"
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded transition"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="border border-purple-600 hover:border-purple-700 text-purple-300 hover:text-white font-medium py-2 px-6 rounded transition"
        >
          Log In
        </Link>
      </div>

      <div className="mt-12 text-sm text-slate-500 text-center">
        Built for minds that wander — we bring the focus back.
      </div>
    </div>
  )
}
