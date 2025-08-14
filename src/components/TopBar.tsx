// 'use client'

// import Link from 'next/link'

// export default function Topbar() {
//   return (
//     <nav className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md z-30">
//       <h1 className="text-lg font-bold tracking-tight">NeuroNest</h1>
//       <div className="flex gap-4">
//         <Link
//           href="/signup"
//           className="text-sm bg-blue-600 px-4 py-1.5 rounded hover:bg-blue-700 transition"
//         >
//           Sign up
//         </Link>
//         <Link
//           href="/login"
//           className="text-sm bg-purple-600 px-4 py-1.5 rounded hover:bg-purple-700 transition"
//         >
//           Log in
//         </Link>
//       </div>
//     </nav>
//   )
// }




'use client'

import Link from 'next/link'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { trackAuthAction } from '@/lib/analytics'
import { useUserContext } from '@/components/UserProvider'

export default function Topbar() {
  const { user, username, loading: userLoading } = useUserContext()
  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Handle initial auth state loading
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        await supabaseClient.auth.getSession()
      } catch (error) {
        console.error('Error checking auth state:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuthState()
  }, [supabaseClient])

  // Helper function to get display name with proper truncation
  const getDisplayName = () => {
    if (username) {
      // Truncate username if it's too long (more than 20 characters)
      return username.length > 20 ? `${username.substring(0, 17)}...` : username
    }
    // Fallback to email if username is not available
    if (user?.email) {
      // Truncate email if it's too long
      return user.email.length > 25 ? `${user.email.substring(0, 22)}...` : user.email
    }
    return 'User'
  }

  const handleLogout = async () => {
    // Track logout event
    trackAuthAction('logout')
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md z-30">
      <h1 className="text-lg font-bold tracking-tight">NeuroNest</h1>
      <div className="flex items-center gap-4">
        {isLoading || userLoading ? (
          // Show loading state to prevent flash of unauthenticated content
          <div className="w-24 h-8 bg-slate-700 animate-pulse rounded-md"></div>
        ) : user ? (
          // If user is logged in, show their username (or email as fallback) and a Log out button
          <>
            <span className="text-sm text-gray-300 hidden sm:block" title={username ? `Username: ${username}` : `Email: ${user.email}`}>
              Welcome, {getDisplayName()}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 px-4 py-1.5 rounded-md hover:bg-red-700 transition"
            >
              Log out
            </button>
          </>
        ) : (
          // If user is not logged in, show Sign up and Log in
          <>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-700 transition"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="text-sm bg-purple-600 px-4 py-1.5 rounded-md hover:bg-purple-700 transition"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}