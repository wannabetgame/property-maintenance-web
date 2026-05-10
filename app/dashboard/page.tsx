'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import OwnerDashboard from '@/components/OwnerDashboard'
import TenantDashboard from '@/components/TenantDashboard' // Keep your existing tenant view
import HandymanDashboard from '@/components/HandymanDashboard' // Keep your existing handyman view

export default function DashboardRouter() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')

      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      setRole(data?.role || 'tenant')
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) return <div className="flex h-screen items-center justify-center">Verifying access...</div>

  return (
    <>
      {role === 'owner' && <OwnerDashboard />}
      {role === 'tenant' && <TenantDashboard />}
      {role === 'handyman' && <HandymanDashboard />}
    </>
  )
}