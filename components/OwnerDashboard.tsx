'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function OwnerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ buildings: 0, tenants: 0, handymen: 0, jobs: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 1. Verify user is actually an owner
      const {  { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')

      const {  profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'owner') return router.replace('/dashboard')

      // 2. Fetch counts (optimized with head: true)
      const [bRes, tRes, hRes, jRes] = await Promise.all([
        supabase.from('buildings').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'handyman'),
        supabase.from('work_orders').select('*', { count: 'exact', head: true })
      ])

      setStats({
        buildings: bRes.count || 0,
        tenants: tRes.count || 0,
        handymen: hRes.count || 0,
        jobs: jRes.count || 0
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading dashboard...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900"> 👑 Owner Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage properties, staff, and maintenance requests</p>
        </div>
        <button 
          onClick={handleSignOut} 
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
        >
          Sign Out
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Buildings" value={stats.buildings} icon="🏢" color="bg-blue-50 text-blue-700" />
        <StatCard title="Tenants" value={stats.tenants} icon="" color="bg-purple-50 text-purple-700" />
        <StatCard title="Handymen" value={stats.handymen} icon="🔧" color="bg-orange-50 text-orange-700" />
        <StatCard title="Active Jobs" value={stats.jobs} icon="📋" color="bg-green-50 text-green-700" />
      </div>

      {/* Management Hub */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Hub</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* ️ Buildings - Coming Soon Alert (Fixed to prevent 404) */}
          <button 
            onClick={() => alert('️ Building management is coming in the next update!')}
            className="group block p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition bg-white text-left w-full"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏘️</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Buildings</h3>
                <p className="text-sm text-gray-500 mt-1">View properties, addresses, and tenant assignments</p>
              </div>
            </div>
          </button>

          {/*  Team - ✅ Fully Working Link */}
          <Link href="/dashboard/owner/team" className="group block p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition bg-white">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Team (Handymen)</h3>
                <p className="text-sm text-gray-500 mt-1">Invite staff, assign buildings, track availability</p>
              </div>
            </div>
          </Link>

          {/* 📝 Work Orders - Coming Soon Alert (Fixed to prevent 404) */}
          <button 
            onClick={() => alert('📝 Work Order monitoring is coming in the next update!')}
            className="group block p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition bg-white text-left w-full"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Work Orders</h3>
                <p className="text-sm text-gray-500 mt-1">Monitor requests, approve jobs, view completion photos</p>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  )
}

// 🔹 Reusable Sub-Components
function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
  return (
    <div className={`p-4 rounded-xl border border-gray-200 ${color}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}