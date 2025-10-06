'use client'

import Link from 'next/link'
import { Calendar, CheckSquare, BarChart3, Brain, ArrowRight, Clock, Target, Zap, Users } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  steps?: string[]
  benefits?: string[]
}

const features: Feature[] = [
  {
    icon: <Calendar size={32} />,
    title: 'Smart Calendar & Scheduler',
    description: 'Organize your tasks with our intelligent weekly view and auto-scheduling',
    steps: [
      'Add tasks with effort estimates',
      'Click "Schedule Tasks" to auto-schedule',
      'Drag & drop to adjust timing',
      'View your week at a glance'
    ],
    benefits: [
      'Never miss a deadline',
      'Optimal time allocation',
      'Visual weekly overview'
    ]
  },
  {
    icon: <CheckSquare size={32} />,
    title: 'ADHD-Friendly Task Management',
    description: 'Track everything from assignments to personal goals with ADHD-specific features',
    steps: [
      'Create tasks with deadlines',
      'Organize by subjects & chapters',
      'Set stress levels and priorities',
      'Filter and sort your way'
    ],
    benefits: [
      'Reduce overwhelm',
      'Clear organization',
      'Stress-aware planning'
    ]
  },
  {
    icon: <Brain size={32} />,
    title: 'Focus Sessions & Pomodoro',
    description: 'Stay focused with our ADHD-optimized Pomodoro timer and focus tools',
    steps: [
      'Select a task to focus on',
      'Choose session length (25/50 min)',
      'Use ambient sounds & breathing exercises',
      'Track your focus streaks'
    ],
    benefits: [
      'Improved concentration',
      'Reduced distractions',
      'Better work habits'
    ]
  },
  {
    icon: <BarChart3 size={32} />,
    title: 'Progress Analytics & Insights',
    description: 'Visualize your productivity patterns and celebrate your achievements',
    steps: [
      'View completion rates',
      'Track study streaks',
      'Analyze productive times',
      'Monitor subject progress'
    ],
    benefits: [
      'Data-driven insights',
      'Motivation through progress',
      'Identify patterns'
    ]
  }
]

const additionalFeatures = [
  {
    icon: <Target size={24} />,
    title: 'Goal Setting',
    description: 'Set and track meaningful goals with progress visualization'
  },
  {
    icon: <Clock size={24} />,
    title: 'Time Blocking',
    description: 'Allocate specific time slots for focused work and breaks'
  },
  {
    icon: <Zap size={24} />,
    title: 'Quick Actions',
    description: 'Rapid task creation and management with keyboard shortcuts'
  },
  {
    icon: <Users size={24} />,
    title: 'Study Groups',
    description: 'Collaborate with classmates and share progress (coming soon)'
  }
]

export default function GuestFeaturePreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="text-8xl mb-6">🧠</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-purple-400">NeuroNest</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              The ADHD-friendly task manager designed for focus, productivity, and building better routines
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition flex items-center justify-center gap-2 text-lg"
              >
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="border-2 border-purple-600 hover:border-purple-500 text-purple-300 hover:text-white font-semibold py-4 px-8 rounded-lg transition text-lg"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need to Stay Organized</h2>
          <p className="text-xl text-slate-300">Built specifically for minds that work differently</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
              <div className="text-purple-400 mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-slate-300 mb-6 text-lg">{feature.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                {feature.steps && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 uppercase tracking-wide">How it works:</h4>
                    <ol className="space-y-2">
                      {feature.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                          <span className="text-purple-400 font-bold text-xs bg-purple-400/20 rounded-full w-5 h-5 flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {feature.benefits && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-300 mb-3 uppercase tracking-wide">Benefits:</h4>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-green-400 mt-1">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Plus Many More Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 text-center hover:border-purple-500/30 transition"
              >
                <div className="text-purple-400 mb-4 flex justify-center">{feature.icon}</div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why NeuroNest */}
        <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">Why NeuroNest?</h3>
            <p className="text-slate-300 text-lg">Designed by and for people with ADHD</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="font-semibold mb-2">ADHD-Optimized</h4>
              <p className="text-slate-400 text-sm">Every feature is designed with ADHD challenges in mind - from overwhelm to hyperfocus</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="font-semibold mb-2">Instant Productivity</h4>
              <p className="text-slate-400 text-sm">Start organizing immediately with intuitive design and smart defaults</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="font-semibold mb-2">Proven Results</h4>
              <p className="text-slate-400 text-sm">Users report 40% better task completion and reduced stress levels</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Productivity?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of students and professionals who&apos;ve found their focus with NeuroNest.
            Start your journey to better organization today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition text-lg"
            >
              Create Your Free Account
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border-2 border-purple-600 hover:border-purple-500 text-purple-300 hover:text-white font-semibold py-4 px-8 rounded-lg transition text-lg"
            >
              Already have an account?
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center text-slate-400">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Your data stays private</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}