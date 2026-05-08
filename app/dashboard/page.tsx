'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/supabase'

export default function DashboardRouter() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        const fetchRole = async () => {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('Role fetch error:', error)
            router.push('/login')
          } else {
            // Redirect to role-specific dashboard
            switch (data.role) {
              case 'tenant': router.push('/dashboard/tenant'); break
              case 'owner': router.push('/dashboard/owner'); break
              case 'handyman': router.push('/dashboard/handyman'); break
              case 'admin': router.push('/dashboard/admin'); break
              default: router.push('/login')
            }
          }
        }
        fetchRole()
      }
    }
  }, [user, authLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Loading your dashboard...
    </div>
  )
}