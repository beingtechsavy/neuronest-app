'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/SideBar'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'

// Define the shape of the user preferences
interface UserPreferences {
  sleep_start: string
  sleep_end: string
  meal_start_times: string[]
  meal_duration: number
  session_length: number
  buffer_length: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          setPreferences(data)
        } else if (error && error.code === 'PGRST116') { // 'PGRST116' means no rows found
          // Set default preferences if none exist
          setPreferences({
            sleep_start: '23:00',
            sleep_end: '07:00',
            meal_start_times: ['08:00', '13:00', '19:00'],
            meal_duration: 60,
            session_length: 50,
            buffer_length: 10,
          })
        }
      }
      setLoading(false)
    }
    fetchUserData()
  }, [])

  const handleSave = async () => {
    if (!user || !preferences) return
    setMessage('Saving...')

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ...preferences })

    if (error) {
      setMessage('Error saving preferences.')
      console.error(error)
    } else {
      setMessage('Preferences saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading || !preferences) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleMealTimeChange = (index: number, value: string) => {
    const newMealTimes = [...preferences.meal_start_times]
    newMealTimes[index] = value
    setPreferences({ ...preferences, meal_start_times: newMealTimes })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-60">
        <main className="p-4 sm:p-8 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-slate-100">
            My Preferences
          </h1>

          <div className="space-y-8">
            {/* Sleep Schedule */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Sleep Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sleep_start" className="block text-sm font-medium text-slate-400 mb-1">I usually sleep at</label>
                  <input type="time" id="sleep_start" value={preferences.sleep_start} onChange={(e) => setPreferences({ ...preferences, sleep_start: e.target.value })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600" />
                </div>
                <div>
                  <label htmlFor="sleep_end" className="block text-sm font-medium text-slate-400 mb-1">And wake up at</label>
                  <input type="time" id="sleep_end" value={preferences.sleep_end} onChange={(e) => setPreferences({ ...preferences, sleep_end: e.target.value })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600" />
                </div>
              </div>
            </div>

            {/* Meal Times */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Meal Times</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {preferences.meal_start_times.map((time, index) => (
                  <div key={index}>
                    <label htmlFor={`meal_time_${index}`} className="block text-sm font-medium text-slate-400 mb-1">{`Meal ${index + 1}`}</label>
                    <input type="time" id={`meal_time_${index}`} value={time} onChange={(e) => handleMealTimeChange(index, e.target.value)} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600" />
                  </div>
                ))}
              </div>
               <div>
                  <label htmlFor="meal_duration" className="block text-sm font-medium text-slate-400 mb-1">Meal Duration (minutes)</label>
                  <input type="number" id="meal_duration" value={preferences.meal_duration} onChange={(e) => setPreferences({ ...preferences, meal_duration: parseInt(e.target.value) })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600" />
                </div>
            </div>

            {/* Study Sessions */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Study Sessions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="session_length" className="block text-sm font-medium text-slate-400 mb-1">Ideal session length (minutes)</label>
                  <input type="number" id="session_length" value={preferences.session_length} onChange={(e) => setPreferences({ ...preferences, session_length: parseInt(e.target.value) })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600" />
                </div>
                <div>
                  <label htmlFor="buffer_length" className="block text-sm font-medium text-slate-400 mb-1">Break between sessions (minutes)</label>
                  <input type="number" id="buffer_length" value={preferences.buffer_length} onChange={(e) => setPreferences({ ...preferences, buffer_length: parseInt(e.target.value) })} className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600" />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end items-center gap-4">
              {message && <span className="text-green-400 text-sm">{message}</span>}
              <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
