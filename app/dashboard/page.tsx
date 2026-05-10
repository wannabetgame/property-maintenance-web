'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import OwnerDashboard from '@/components/OwnerDashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser() // ✅ Fixed destructuring
      if (!user) return router.replace('/login')

      // 2. Get their role from the users table
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setRole(data?.role || 'tenant')
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading dashboard...</div>
  }

  // ✅ Show Owner Dashboard if role is owner
  if (role === 'owner') {
    return <OwnerDashboard />
  }

  // ✅ Fallback for Tenant/Handyman
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4"> Welcome, {role}!</h1>
        <p className="text-gray-600 mb-6">Your personalized dashboard is loading...</p>
        
        <div className="bg-white p-6 rounded-lg border">
          <p>✅ You're logged in.</p>
          <p className="text-sm text-gray-500 mt-2">Role: <strong>{role}</strong></p>
        </div>
      </div>
    </div>
  )
}