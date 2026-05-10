'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch buildings on load
  useEffect(() => {
    async function fetchBuildings() {
      const { data, error } = await supabase.from('buildings').select('id, name')
      if (!error && data) setBuildings(data)
    }
    fetchBuildings()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!buildingId || !unitNumber) {
      setError('Please select a building and enter a unit number.')
      setLoading(false)
      return
    }

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData?.user) throw new Error('No user returned')

      // 2. Insert user into public.users table with role and building info
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: email,
        role: 'tenant', // Default role for signups
        building_id: buildingId,
        unit_number: unitNumber,
      })

      if (profileError) throw profileError

      alert('Account created! Please check your email to confirm.')
      router.push('/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-center">Create Tenant Account</h2>
        
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          {/* Building Selector */}
          <div>
            <label className="block text-sm font-medium">Select Building</label>
            <select
              required
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            >
              <option value="">-- Choose a Building --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Unit Number */}
          <div>
            <label className="block text-sm font-medium">Apartment / Unit Number</label>
            <input
              type="text"
              required
              placeholder="e.g. 101B"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}