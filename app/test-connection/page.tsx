'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [status, setStatus] = useState('🔄 Testing connection...')

  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.from('sla_configs').select('*')
      
      if (error) {
        setStatus(`❌ Connection Failed: ${error.message}`)
        console.error('Supabase Error:', error)
      } else {
        setStatus(`✅ Connected! Successfully fetched ${data.length} SLA rules.`)
      }
    }
    test()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="rounded-xl border bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Supabase Connection Test</h1>
        <p className="text-lg font-medium text-gray-700">{status}</p>
      </div>
    </div>
  )
}