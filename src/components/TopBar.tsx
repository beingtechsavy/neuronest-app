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
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const user = useUser()
  const supabaseClient = useSupabaseClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md z-30">
      <h1 className="text-lg font-bold tracking-tight">NeuroNest</h1>
      <div className="flex items-center gap-4">
        {user ? (
          // If user is logged in, show their email and a Log out button
          <>
            <span className="text-sm text-gray-300 hidden sm:block">
              Welcome, {user.email}
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